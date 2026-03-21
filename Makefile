# ============================================
# MAKEFILE - Comandos Úteis
# ============================================

.PHONY: help install dev build test lint clean docker-up docker-down seed deploy

# Default target
help:
	@echo "Planner5D Pro - Available Commands"
	@echo "=================================="
	@echo "make install     - Install all dependencies"
	@echo "make dev         - Start development servers"
	@echo "make build       - Build for production"
	@echo "make test        - Run all tests"
	@echo "make lint        - Run linter"
	@echo "make clean       - Clean build files"
	@echo "make docker-up   - Start Docker containers"
	@echo "make docker-down - Stop Docker containers"
	@echo "make seed        - Seed database"
	@echo "make deploy      - Deploy to production"

# Installation
install:
	@echo "Installing frontend dependencies..."
	npm install
	@echo "Installing backend dependencies..."
	cd server && npm install

# Development
dev:
	@echo "Starting development servers..."
	concurrently \
		"npm run dev" \
		"cd server && npm run dev" \
		--names "FRONTEND,BACKEND" \
		--prefix-colors "blue,green"

# Build
build:
	@echo "Building frontend..."
	npm run build
	@echo "Building backend..."
	cd server && npm run build

# Tests
test:
	@echo "Running frontend tests..."
	npm run test
	@echo "Running backend tests..."
	cd server && npm run test

test-coverage:
	@echo "Running tests with coverage..."
	npm run test:coverage
	cd server && npm run test:coverage

# Linting
lint:
	@echo "Running linter..."
	npm run lint
	cd server && npm run lint

lint-fix:
	@echo "Fixing lint errors..."
	npm run lint:fix
	cd server && npm run lint:fix

# Type checking
type-check:
	@echo "Running type check..."
	npm run type-check
	cd server && npm run type-check

# Cleaning
clean:
	@echo "Cleaning build files..."
	rm -rf dist
	rm -rf server/dist
	rm -rf node_modules
	rm -rf server/node_modules
	rm -rf coverage
	rm -rf server/coverage

# Docker
docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

docker-logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

# Database
db-migrate:
	@echo "Running database migrations..."
	cd server && npx prisma migrate dev

db-generate:
	@echo "Generating Prisma client..."
	cd server && npx prisma generate

db-studio:
	@echo "Opening Prisma Studio..."
	cd server && npx prisma studio

db-reset:
	@echo "Resetting database..."
	cd server && npx prisma migrate reset --force

seed:
	@echo "Seeding database..."
	cd server && node ../scripts/seed.js

# Deployment
deploy:
	@echo "Deploying to production..."
	./scripts/deploy.sh production

deploy-staging:
	@echo "Deploying to staging..."
	./scripts/deploy.sh staging

# Setup
setup:
	@echo "Running setup..."
	./scripts/setup.sh
