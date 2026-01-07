# Development Scripts

This directory contains utility scripts for managing the Northwind development environment.

## local-dev.sh

Comprehensive script to manage local development servers (backend Docker services and frontend Vite server).

### Usage

```bash
# Show help
./scripts/local-dev.sh

# Start all services
./scripts/local-dev.sh start

# Stop all services
./scripts/local-dev.sh stop

# Restart all services
./scripts/local-dev.sh restart

# Check status
./scripts/local-dev.sh status
```

### Individual Service Commands

```bash
# Backend only
./scripts/local-dev.sh backend-start
./scripts/local-dev.sh backend-stop

# Frontend only
./scripts/local-dev.sh frontend-start
./scripts/local-dev.sh frontend-stop
```

### Features

- **Color-coded output** for easy reading
- **Health checks** for all services
- **Port management** - automatically handles port conflicts
- **Log management** - frontend logs saved to `logs/frontend.log`
- **Process tracking** - PID files for clean shutdowns
- **Status monitoring** - check what's running at any time

### What It Manages

1. **Backend Services (Docker)**
   - PostgreSQL database (port 5432)
   - FastAPI backend (port 8000)

2. **Frontend Service**
   - Vite dev server (ports 5173-5175)

### Logs

- Frontend logs: `logs/frontend.log`
- Backend logs: `docker-compose logs -f backend`
- Database logs: `docker-compose logs -f db`

### Tips

- Use `status` frequently to check service health
- Frontend logs are saved, so you can tail them: `tail -f logs/frontend.log`
- The script handles port conflicts automatically
- Use individual commands for granular control
