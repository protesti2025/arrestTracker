#!/bin/bash

# Protest Tracker Development Environment Startup Script
# This script starts PostgreSQL, Go backend, and React frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
is_port_available() {
    local port=$1
    ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to find available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while ! is_port_available $port; do
        port=$((port + 1))
        if [ $port -gt $((start_port + 100)) ]; then
            print_error "Could not find available port starting from $start_port"
            return 1
        fi
    done
    
    echo $port
}

# Function to wait for service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            print_status "$service_name is ready!"
            return 0
        fi
        
        printf "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $max_attempts seconds"
    return 1
}

# Function to cleanup on exit
cleanup() {
    print_section "Cleaning up..."
    
    # Kill background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Stop Docker containers
    print_status "Stopping Docker containers..."
    docker-compose -f backend/docker-compose.yml down 2>/dev/null || true
    
    print_status "Cleanup complete"
    exit 0
}

# Trap cleanup function on script exit
trap cleanup EXIT INT TERM

# Check prerequisites
print_section "Checking Prerequisites"

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists go; then
    print_error "Go is not installed. Please install Go 1.21 or higher."
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

if ! command_exists nc; then
    print_warning "netcat (nc) is not installed. Service readiness checks may not work properly."
fi

print_status "All prerequisites are available"

# Clean up any existing processes
print_section "Cleaning up existing processes"
pkill -f "protest-tracker" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
docker-compose -f backend/docker-compose.yml down 2>/dev/null || true

# Set up ports
BACKEND_PORT=8080
FRONTEND_PORT=3000

# Check if backend port is available
if ! is_port_available $BACKEND_PORT; then
    print_warning "Port $BACKEND_PORT is not available, finding alternative..."
    BACKEND_PORT=$(find_available_port $BACKEND_PORT)
    print_status "Using port $BACKEND_PORT for backend"
fi

# Check if frontend port is available
if ! is_port_available $FRONTEND_PORT; then
    print_warning "Port $FRONTEND_PORT is not available, finding alternative..."
    FRONTEND_PORT=$(find_available_port $FRONTEND_PORT)
    print_status "Using port $FRONTEND_PORT for frontend"
fi

# Load environment variables
print_section "Loading Environment Variables"

if [ -f "./backend/.env" ]; then
    print_status "Loading backend environment variables..."
    export $(cat ./backend/.env | grep -v '^#' | xargs)
else
    print_warning "Backend .env file not found. Using defaults..."
fi

# Override port with our selected port
export PORT=$BACKEND_PORT
export DATABASE_URL="host=0.0.0.0 port=5432 user=postgres password=postgres dbname=protest_tracker sslmode=disable"
export JWT_SECRET="${JWT_SECRET:-your-secret-key-change-in-production}"
export MEDIA_DIR="${MEDIA_DIR:-./media}"

# Create/update frontend .env
print_status "Setting up frontend environment..."
cat > ./frontend/.env << EOF
REACT_APP_API_URL=http://0.0.0.0:$BACKEND_PORT/api
PORT=$FRONTEND_PORT
EOF

export REACT_APP_API_URL="http://0.0.0.0:$BACKEND_PORT/api"

print_status "Environment variables loaded"

# Start PostgreSQL with Docker
print_section "Starting PostgreSQL Database"

print_status "Starting PostgreSQL container..."
docker-compose -f backend/docker-compose.yml up -d postgres

# Wait for PostgreSQL to be ready
wait_for_service 0.0.0.0 5432 "PostgreSQL"

# Give PostgreSQL a moment to fully initialize
sleep 2

# Install backend dependencies
print_section "Setting up Go Backend"

cd backend
print_status "Installing Go dependencies..."
go mod download
go mod tidy

# Build the backend
print_status "Building Go backend..."
go build -o protest-tracker .

print_status "Starting Go backend server on port $BACKEND_PORT..."
./protest-tracker > logs 2>&1 &
BACKEND_PID=$!

cd ..

# Wait for backend to be ready
wait_for_service 0.0.0.0 $BACKEND_PORT "Go Backend"

# Install frontend dependencies and start
print_section "Setting up React Frontend"

cd frontend
print_status "Installing npm dependencies..."
npm install

print_status "Starting React development server on port $FRONTEND_PORT..."
PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!

cd ..

# Wait for frontend to be ready
wait_for_service 0.0.0.0 $FRONTEND_PORT "React Frontend"

# Display status
print_section "Development Environment Ready"

echo -e "${GREEN}🚀 All services are running successfully!${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo -e "  📊 PostgreSQL Database: ${GREEN}http://0.0.0.0:5432${NC}"
echo -e "  🔧 Go Backend API:      ${GREEN}http://0.0.0.0:$BACKEND_PORT${NC}"
echo -e "  🌐 React Frontend:      ${GREEN}http://0.0.0.0:$FRONTEND_PORT${NC}"
echo ""
echo -e "${BLUE}API Documentation:${NC}"
echo -e "  📖 Health Check:        ${GREEN}http://0.0.0.0:$BACKEND_PORT/api/health${NC}"
echo -e "  🔐 Login Endpoint:      ${GREEN}http://0.0.0.0:$BACKEND_PORT/api/login${NC}"
echo -e "  📋 Events Endpoint:     ${GREEN}http://0.0.0.0:$BACKEND_PORT/api/events${NC}"
echo ""
echo -e "${BLUE}Sample Users:${NC}"
echo -e "  👤 Spotter:   ${YELLOW}spotter@example.com${NC} / ${YELLOW}password${NC}"
echo -e "  👤 Advocate:  ${YELLOW}advocate@example.com${NC} / ${YELLOW}password${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for user to stop the services
wait