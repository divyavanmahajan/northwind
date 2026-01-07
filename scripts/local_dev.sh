#!/bin/bash

# Northwind Local Development Server Management Script
# Usage: ./scripts/local_dev.sh [start|stop|restart|status]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is in use
is_port_in_use() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    if is_port_in_use $port; then
        print_info "Stopping process on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Function to start backend services
start_backend() {
    print_info "Starting backend services (Docker)..."
    cd "$PROJECT_ROOT"
    
    # Start Docker services
    docker-compose up -d
    
    print_info "Waiting for services to be healthy..."
    sleep 3
    
    # Check backend health
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        print_info "✓ Backend is running at http://localhost:8000"
    else
        print_warn "Backend may still be starting up..."
    fi
}

# Function to stop backend services
stop_backend() {
    print_info "Stopping backend services (Docker)..."
    cd "$PROJECT_ROOT"
    docker-compose down
    print_info "✓ Backend services stopped"
}

# Function to start frontend
start_frontend() {
    print_info "Starting frontend development server..."
    
    # Kill any existing processes on common Vite ports
    kill_port 5173
    kill_port 5174
    kill_port 5175
    
    cd "$FRONTEND_DIR"
    
    # Start frontend in background
    print_info "Starting Vite dev server..."
    nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    
    # Save PID
    echo $! > "$PROJECT_ROOT/logs/frontend.pid"
    
    sleep 3
    
    # Check if frontend is running
    if is_port_in_use 5173; then
        print_info "✓ Frontend is running at http://localhost:5173"
    elif is_port_in_use 5174; then
        print_info "✓ Frontend is running at http://localhost:5174"
    elif is_port_in_use 5175; then
        print_info "✓ Frontend is running at http://localhost:5175"
    else
        print_warn "Frontend may still be starting up. Check logs/frontend.log"
    fi
}

# Function to stop frontend
stop_frontend() {
    print_info "Stopping frontend development server..."
    
    # Kill by PID if exists
    if [ -f "$PROJECT_ROOT/logs/frontend.pid" ]; then
        local pid=$(cat "$PROJECT_ROOT/logs/frontend.pid")
        kill $pid 2>/dev/null || true
        rm "$PROJECT_ROOT/logs/frontend.pid"
    fi
    
    # Kill any processes on Vite ports
    kill_port 5173
    kill_port 5174
    kill_port 5175
    
    print_info "✓ Frontend server stopped"
}

# Function to show status
show_status() {
    print_info "Checking service status..."
    echo ""
    
    # Backend status
    if docker-compose ps | grep -q "northwind-backend.*Up"; then
        print_info "✓ Backend (Docker): Running on http://localhost:8000"
    else
        print_warn "✗ Backend (Docker): Not running"
    fi
    
    # Database status
    if docker-compose ps | grep -q "northwind-db.*Up"; then
        print_info "✓ Database (PostgreSQL): Running on localhost:5432"
    else
        print_warn "✗ Database (PostgreSQL): Not running"
    fi
    
    # Frontend status
    if is_port_in_use 5173; then
        print_info "✓ Frontend (Vite): Running on http://localhost:5173"
    elif is_port_in_use 5174; then
        print_info "✓ Frontend (Vite): Running on http://localhost:5174"
    elif is_port_in_use 5175; then
        print_info "✓ Frontend (Vite): Running on http://localhost:5175"
    else
        print_warn "✗ Frontend (Vite): Not running"
    fi
    
    echo ""
}

# Function to start all services
start_all() {
    print_info "========================================="
    print_info "Starting Northwind Development Environment"
    print_info "========================================="
    echo ""
    
    # Create logs directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/logs"
    
    start_backend
    echo ""
    start_frontend
    echo ""
    
    print_info "========================================="
    print_info "All services started!"
    print_info "========================================="
    echo ""
    show_status
    echo ""
    print_info "Frontend logs: tail -f logs/frontend.log"
    print_info "Backend logs: docker-compose logs -f backend"
}

# Function to stop all services
stop_all() {
    print_info "========================================="
    print_info "Stopping Northwind Development Environment"
    print_info "========================================="
    echo ""
    
    stop_frontend
    echo ""
    stop_backend
    echo ""
    
    print_info "========================================="
    print_info "All services stopped!"
    print_info "========================================="
}

# Function to restart all services
restart_all() {
    print_info "Restarting all services..."
    echo ""
    stop_all
    echo ""
    sleep 2
    echo ""
    start_all
}

# Main script logic
case "${1:-}" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart_all
        ;;
    status)
        show_status
        ;;
    backend-start)
        start_backend
        ;;
    backend-stop)
        stop_backend
        ;;
    frontend-start)
        start_frontend
        ;;
    frontend-stop)
        stop_frontend
        ;;
    *)
        echo "Northwind Development Server Management"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start           Start all services (backend + frontend)"
        echo "  stop            Stop all services"
        echo "  restart         Restart all services"
        echo "  status          Show status of all services"
        echo ""
        echo "Individual service commands:"
        echo "  backend-start   Start only backend services"
        echo "  backend-stop    Stop only backend services"
        echo "  frontend-start  Start only frontend server"
        echo "  frontend-stop   Stop only frontend server"
        echo ""
        exit 1
        ;;
esac
