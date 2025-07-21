# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_NAME=protest-tracker
BINARY_UNIX=$(BINARY_NAME)_unix

# Build the application
build:
	$(GOBUILD) -o $(BINARY_NAME) -v ./cmd/server

# Clean build files
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -f $(BINARY_UNIX)

# Run tests
test:
	$(GOTEST) -v ./...

# Run tests with coverage
test-coverage:
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out

# Download dependencies
deps:
	$(GOMOD) download
	$(GOMOD) tidy

# Run the application
run:
	$(GOBUILD) -o $(BINARY_NAME) -v ./cmd/server
	./$(BINARY_NAME)

# Run with live reload (requires air: go install github.com/cosmtrek/air@latest)
dev:
	air

# Build for Linux
build-linux:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BINARY_UNIX) -v ./cmd/server

# Docker build
docker-build:
	docker build -t protest-tracker .

# Docker run
docker-run:
	docker run -p 8080:8080 protest-tracker

# Format code
fmt:
	$(GOCMD) fmt ./...

# Vet code
vet:
	$(GOCMD) vet ./...

# Lint code (requires golangci-lint)
lint:
	golangci-lint run

# Create migration (usage: make migrate-create name=create_users_table)
migrate-create:
	migrate create -ext sql -dir migrations -seq $(name)

# Run migrations up
migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

# Run migrations down
migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down

# Install development tools
install-tools:
	go install github.com/cosmtrek/air@latest
	go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

.PHONY: build clean test test-coverage deps run dev build-linux docker-build docker-run fmt vet lint migrate-create migrate-up migrate-down install-tools