#!/bin/bash
# ============================================
# SETUP SCRIPT - Configuração Inicial do Projeto
# ============================================

set -e

echo "🚀 Planner5D Pro - Setup Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version OK${NC}"

# Check if npm is installed
echo -e "${BLUE}Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm is installed${NC}"

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd server
npm install
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Setup environment files
echo -e "${BLUE}Setting up environment files...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created .env file. Please update it with your settings.${NC}"
fi

if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo -e "${YELLOW}⚠ Created server/.env file. Please update it with your settings.${NC}"
fi
echo -e "${GREEN}✓ Environment files created${NC}"

# Setup database (if Docker is available)
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}Docker detected. Do you want to start the database with Docker? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${BLUE}Starting database with Docker...${NC}"
        docker-compose up -d db redis
        echo -e "${GREEN}✓ Database started${NC}"
        
        # Wait for database to be ready
        echo -e "${BLUE}Waiting for database to be ready...${NC}"
        sleep 5
        
        # Run migrations
        echo -e "${BLUE}Running database migrations...${NC}"
        cd server
        npx prisma migrate dev --name init
        npx prisma generate
        cd ..
        echo -e "${GREEN}✓ Database migrations completed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Docker not detected. Please setup your database manually.${NC}"
fi

# Build the application
echo -e "${BLUE}Building the application...${NC}"
npm run build
echo -e "${GREEN}✓ Build completed${NC}"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Update .env files with your configuration"
echo "  2. Start the backend: cd server && npm run dev"
echo "  3. Start the frontend: npm run dev"
echo "  4. Open http://localhost:5173 in your browser"
echo ""
echo "For more information, see README.md"
