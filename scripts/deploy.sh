#!/bin/bash
# ============================================
# DEPLOY SCRIPT - Script de Deploy
# ============================================

set -e

echo "🚀 Planner5D Pro - Deploy Script"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check environment
ENV=${1:-production}
echo -e "${BLUE}Deploying to: $ENV${NC}"

# Run tests
echo -e "${BLUE}Running tests...${NC}"
npm run test
if [ $? -ne 0 ]; then
    echo -e "${RED}Tests failed! Aborting deploy.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Tests passed${NC}"

# Build frontend
echo -e "${BLUE}Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built${NC}"

# Build backend
echo -e "${BLUE}Building backend...${NC}"
cd server
npm run build
cd ..
echo -e "${GREEN}✓ Backend built${NC}"

# Deploy based on environment
if [ "$ENV" = "production" ]; then
    echo -e "${BLUE}Deploying to production...${NC}"
    
    # Deploy frontend to Vercel
    if command -v vercel &> /dev/null; then
        echo -e "${BLUE}Deploying frontend to Vercel...${NC}"
        vercel --prod
        echo -e "${GREEN}✓ Frontend deployed${NC}"
    else
        echo -e "${YELLOW}⚠ Vercel CLI not found. Skipping frontend deploy.${NC}"
    fi
    
    # Deploy backend to Render
    if command -v render &> /dev/null; then
        echo -e "${BLUE}Deploying backend to Render...${NC}"
        render deploy
        echo -e "${GREEN}✓ Backend deployed${NC}"
    else
        echo -e "${YELLOW}⚠ Render CLI not found. Skipping backend deploy.${NC}"
    fi
    
elif [ "$ENV" = "staging" ]; then
    echo -e "${BLUE}Deploying to staging...${NC}"
    
    # Deploy to staging environment
    if command -v vercel &> /dev/null; then
        echo -e "${BLUE}Deploying to Vercel (staging)...${NC}"
        vercel
        echo -e "${GREEN}✓ Deployed to staging${NC}"
    fi
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Deploy completed!${NC}"
echo -e "${GREEN}================================${NC}"
