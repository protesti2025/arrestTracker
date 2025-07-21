#!/bin/bash

# Protest Tracker Development Environment Shutdown Script
# This script stops all development services

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

print_section "Stopping Development Environment"

# Stop React frontend (usually runs on port 3000)
print_status "Stopping React frontend..."
pkill -f "react-scripts start" 2>/dev/null || print_warning "React frontend not running"

# Stop Go backend
print_status "Stopping Go backend..."
pkill -f "protest-tracker" 2>/dev/null || print_warning "Go backend not running"

# Stop any Node.js processes that might be running
print_status "Stopping any remaining Node.js processes..."
pkill -f "node.*start" 2>/dev/null || true

# Stop Docker containers
print_status "Stopping Docker containers..."
if [ -f "./backend/docker-compose.yml" ]; then
    docker-compose -f backend/docker-compose.yml down 2>/dev/null || print_warning "Docker containers not running"
else
    print_warning "Docker compose file not found"
fi

# Clean up any remaining processes on common ports
print_status "Cleaning up processes on common ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5432 | xargs kill -9 2>/dev/null || true

print_section "Cleanup Complete"
print_status "All development services have been stopped"