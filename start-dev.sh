#!/bin/bash

# VeTerex Development Start Script
# This script starts both frontend and backend in development mode

echo "🚀 Starting VeTerex Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the VeTerex root directory"
    exit 1
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    pkill -P $$
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start Backend
echo -e "${BLUE}📦 Starting Backend (Port 3001)...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    pnpm install
fi

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
    echo "Generating Prisma client..."
    pnpm run prisma:generate
fi

pnpm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo -e "${GREEN}🎨 Starting Frontend (Port 5173)...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    pnpm install
fi
pnpm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ VeTerex Development Environment Started!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📱 Frontend: http://localhost:5173"
echo "  🔌 Backend:  http://localhost:3001"
echo "  📊 Prisma:   Run 'cd backend && pnpm run prisma:studio'"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait
