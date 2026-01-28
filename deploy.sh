#!/bin/bash

# ==========================================
# RESTOHUB DEPLOYMENT SCRIPT
# ==========================================
# Script ini akan membantu proses deployment

set -e  # Exit jika ada error

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# CHECK PREREQUISITES
# ==========================================

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Checking Prerequisites...${NC}"
echo -e "${BLUE}============================================${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker first.${NC}"
    echo -e "${YELLOW}Run: curl -fsSL https://get.docker.com -o get-docker.sh | sudo sh get-docker.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found.${NC}"
    echo -e "${YELLOW}Run: sudo apt install docker-compose${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found (version: $(node -v))${NC}"

# ==========================================
# ENVIRONMENT SETUP
# ==========================================

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Setting up Environment...${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ .env.local not found. Creating from .env.example...${NC}"
    cp .env.example .env.local

    # Generate random secret
    SECRET=$(openssl rand -base64 32)
    sed -i "s/CHANGE_THIS_SECRET/$SECRET/g" .env.local

    echo -e "${GREEN}✓ .env.local created with new secret${NC}"
    echo -e "${YELLOW}⚠ Please review and update .env.local with your actual values${NC}"
    echo -e "${YELLOW}⚠ Especially update NEXTAUTH_SECRET, DATABASE_URL, and MINIO credentials${NC}"
else
    echo -e "${GREEN}✓ .env.local found${NC}"
fi

# ==========================================
# CREATE NECESSARY DIRECTORIES
# ==========================================

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Creating Necessary Directories...${NC}"
echo -e "${BLUE}============================================${NC}"

mkdir -p db
mkdir -p logs
mkdir -p public/uploads
echo -e "${GREEN}✓ Directories created${NC}"

# ==========================================
# MENU OPTIONS
# ==========================================

show_menu() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}  RESTOHUB DEPLOYMENT MENU  ${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo -e "${GREEN}1)${NC} - Install Dependencies"
    echo -e "${GREEN}2)${NC} - Setup Database"
    echo -e "${GREEN}3)${NC} - Build Application"
    echo -e "${GREEN}4)${NC} - Start with Docker"
    echo -e "${GREEN}5)${NC} - Start with PM2"
    echo -e "${GREEN}6)${NC} - Stop Services"
    echo -e "${GREEN}7)${NC} - View Logs"
    echo -e "${GREEN}8)${NC} - Health Check"
    echo -e "${GREEN}0)${NC} - Exit"
    echo -e "${BLUE}============================================${NC}"
}

# ==========================================
# OPTION 1: INSTALL DEPENDENCIES
# ==========================================

install_dependencies() {
    echo -e "\n${GREEN}Installing Dependencies...${NC}"

    # Check package manager
    if command -v bun &> /dev/null; then
        echo -e "${GREEN}Using Bun package manager...${NC}"
        bun install
    elif command -v npm &> /dev/null; then
        echo -e "${GREEN}Using npm package manager...${NC}"
        npm install
    else
        echo -e "${RED}✗ Neither bun nor npm found${NC}"
        exit 1
    fi

    # Generate Prisma client
    if command -v bun &> /dev/null; then
        echo -e "${GREEN}Generating Prisma client...${NC}"
        bunx prisma generate
    else
        echo -e "${GREEN}Generating Prisma client...${NC}"
        npx prisma generate
    fi

    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
}

# ==========================================
# OPTION 2: SETUP DATABASE
# ==========================================

setup_database() {
    echo -e "\n${GREEN}Setting up Database...${NC}"

    # Check which database to use
    if grep -q "postgresql:" .env.local; then
        echo -e "${YELLOW}Using PostgreSQL (production mode)${NC}"
        echo -e "${YELLOW}⚠ Make sure PostgreSQL is running and configured${NC}"
    else
        echo -e "${YELLOW}Using SQLite (development mode)${NC}"
        echo -e "${YELLOW}Database will be created at: db/dev.db${NC}"
    fi

    # Run Prisma migrations
    if command -v bun &> /dev/null; then
        echo -e "${GREEN}Running Prisma migrations...${NC}"
        bunx prisma migrate dev
    else
        echo -e "${GREEN}Running Prisma migrations...${NC}"
        npx prisma migrate dev
    fi

    echo -e "${GREEN}✓ Database setup complete${NC}"
}

# ==========================================
# OPTION 3: BUILD APPLICATION
# ==========================================

build_application() {
    echo -e "\n${GREEN}Building Application...${NC}"

    # Clear previous builds
    rm -rf .next

    if command -v bun &> /dev/null; then
        echo -e "${GREEN}Building with Bun...${NC}"
        bun run build
    else
        echo -e "${GREEN}Building with npm...${NC}"
        npm run build
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Build successful${NC}"
    else
        echo -e "${RED}✗ Build failed${NC}"
        exit 1
    fi
}

# ==========================================
# OPTION 4: START WITH DOCKER
# ==========================================

start_docker() {
    echo -e "\n${GREEN}Starting with Docker Compose...${NC}"

    # Stop existing containers
    docker-compose down 2>/dev/null

    # Build and start
    docker-compose build --no-cache
    docker-compose up -d

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Docker services started successfully${NC}"
        echo -e "\n${BLUE}Services:${NC}"
        docker-compose ps
        echo -e "\n${YELLOW}To view logs, run:${NC}"
        echo -e "  docker-compose logs -f app"
        echo -e "\n${YELLOW}To stop services, run:${NC}"
        echo -e "  docker-compose down"
    else
        echo -e "${RED}✗ Failed to start Docker services${NC}"
        exit 1
    fi
}

# ==========================================
# OPTION 5: START WITH PM2
# ==========================================

start_pm2() {
    echo -e "\n${GREEN}Starting with PM2...${NC}"

    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}✗ PM2 not found${NC}"
        echo -e "${YELLOW}Install PM2: sudo npm install -g pm2${NC}"
        exit 1
    fi

    # Start application
    pm2 start ecosystem.config.js

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Application started with PM2${NC}"
        echo -e "\n${YELLOW}To view logs, run:${NC}"
        echo -e "  pm2 logs restohub"
        echo -e "\n${YELLOW}To restart, run:${NC}"
        echo -e "  pm2 restart restohub"
    else
        echo -e "${RED}✗ Failed to start with PM2${NC}"
        exit 1
    fi
}

# ==========================================
# OPTION 6: STOP SERVICES
# ==========================================

stop_services() {
    echo -e "\n${YELLOW}Stopping Services...${NC}"

    # Stop Docker services
    if docker-compose ps | grep -q "Up"; then
        docker-compose down
        echo -e "${GREEN}✓ Docker services stopped${NC}"
    else
        echo -e "${YELLOW}No Docker services running${NC}"
    fi

    # Stop PM2 services
    if command -v pm2 &> /dev/null; then
        pm2 stop restohub
        echo -e "${GREEN}✓ PM2 services stopped${NC}"
    fi
}

# ==========================================
# OPTION 7: VIEW LOGS
# ==========================================

view_logs() {
    echo -e "\n${GREEN}Fetching Recent Logs...${NC}"

    # Docker logs
    if docker-compose ps | grep -q "Up"; then
        echo -e "${BLUE}=== Docker Logs (last 50 lines) ===${NC}"
        docker-compose logs --tail=50 app
    fi

    # PM2 logs
    if command -v pm2 &> /dev/null; then
        echo -e "\n${BLUE}=== PM2 Logs (last 50 lines) ===${NC}"
        pm2 logs restohub --lines 50 --nostream
    fi

    # Application logs
    if [ -d "logs" ]; then
        echo -e "\n${BLUE}=== Application Logs ===${NC}"
        tail -n 50 logs/*.log 2>/dev/null || echo "No application logs found"
    fi
}

# ==========================================
# OPTION 8: HEALTH CHECK
# ==========================================

health_check() {
    echo -e "\n${GREEN}Running Health Check...${NC}"

    # Check if app is running
    if docker-compose ps | grep -q "Up"; then
        echo -e "${BLUE}Checking Docker services...${NC}"
        docker-compose ps

        # Try health endpoint
        echo -e "${BLUE}Testing API health endpoint...${NC}"
        if curl -s http://localhost:3000/api/health &> /dev/null; then
            echo -e "${GREEN}✓ Health endpoint responding${NC}"
        else
            echo -e "${YELLOW}⚠ Health endpoint not responding${NC}"
        fi
    elif command -v pm2 &> /dev/null; then
        echo -e "${BLUE}Checking PM2 services...${NC}"
        pm2 status

        # Try health endpoint
        echo -e "${BLUE}Testing API health endpoint...${NC}"
        if curl -s http://localhost:3000/api/health &> /dev/null; then
            echo -e "${GREEN}✓ Health endpoint responding${NC}"
        else
            echo -e "${YELLOW}⚠ Health endpoint not responding${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ No services running${NC}"
    fi
}

# ==========================================
# MAIN LOOP
# ==========================================

while true; do
    show_menu
    read -p "Select an option: " choice

    case $choice in
        1)
            install_dependencies
            ;;
        2)
            setup_database
            ;;
        3)
            build_application
            ;;
        4)
            start_docker
            ;;
        5)
            start_pm2
            ;;
        6)
            stop_services
            ;;
        7)
            view_logs
            ;;
        8)
            health_check
            ;;
        0)
            echo -e "\n${GREEN}Exiting...${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            ;;
    esac
done
