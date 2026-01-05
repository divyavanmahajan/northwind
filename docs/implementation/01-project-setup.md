# Prompt 01: Project Setup & Docker Configuration

## Context
This is the first implementation step for the Northwind Web Application. We are setting up the foundational project structure and Docker configuration that all subsequent development will build upon.

## Prerequisites
- Docker and Docker Compose installed
- Git installed
- Basic familiarity with Python and Node.js

## Goals
1. Create the project directory structure
2. Set up Docker Compose for local development
3. Configure PostgreSQL database container
4. Create placeholder backend and frontend directories
5. Establish environment variable patterns

---

## Prompt

```text
Create the foundational project structure for a Northwind Web Application with Docker-based development environment.

PROJECT STRUCTURE:
Create the following directory structure:
```
northwind-test/
├── docker-compose.yml
├── .env.example
├── .env (gitignored)
├── .gitignore
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── __init__.py
└── frontend/
    ├── Dockerfile
    └── .gitkeep
```

DOCKER-COMPOSE.YML:
Create a docker-compose.yml with:
1. PostgreSQL 15 service named 'db':
   - Use postgres:15-alpine image
   - Map port 5432:5432
   - Set POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD from environment
   - Add a health check using pg_isready
   - Create a named volume 'postgres_data' for persistence

2. Backend service placeholder:
   - Build from ./backend/Dockerfile
   - Map port 8000:8000
   - Depends on db with condition: service_healthy
   - Mount ./backend:/app for development
   - Set DATABASE_URL environment variable

3. Frontend service placeholder:
   - Build from ./frontend/Dockerfile  
   - Map port 5173:5173
   - Mount ./frontend:/app for development

ENVIRONMENT FILES:
Create .env.example with:
```
DB_NAME=northwind
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400

ENVIRONMENT=development
DEBUG=true
```

BACKEND DOCKERFILE:
Create a minimal Dockerfile:
- Use python:3.11-slim as base
- Set WORKDIR /app
- Copy and install requirements.txt
- Copy app directory
- CMD to run uvicorn

REQUIREMENTS.TXT:
Create with minimal dependencies for now:
- fastapi>=0.109.0
- uvicorn[standard]>=0.27.0

GITIGNORE:
Create comprehensive .gitignore for:
- Python: __pycache__, *.pyc, .pytest_cache, .venv, venv
- Node: node_modules, dist, .cache
- Environment: .env, *.local
- IDE: .vscode, .idea
- Docker: postgres_data (local only)
- OS: .DS_Store, Thumbs.db

README.MD:
Create a basic README with:
- Project title and description
- Prerequisites
- Quick start instructions using Docker Compose
- Available services and ports

VERIFICATION:
After creation, verify with:
1. `docker-compose config` - validates compose file
2. `docker-compose up db -d` - starts only database
3. `docker-compose exec db psql -U postgres -c '\l'` - lists databases

SUCCESS CRITERIA:
- All files created with correct content
- docker-compose.yml is valid
- PostgreSQL container starts and is healthy
- Database 'northwind' is created automatically
```

---

## Expected Outputs

### docker-compose.yml
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: northwind-db
    environment:
      POSTGRES_DB: ${DB_NAME:-northwind}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-northwind}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: northwind-backend
    environment:
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@db:5432/${DB_NAME:-northwind}
      JWT_SECRET: ${JWT_SECRET:-development_secret_key_min_32_chars}
      JWT_ALGORITHM: ${JWT_ALGORITHM:-HS256}
      JWT_EXPIRATION: ${JWT_EXPIRATION:-86400}
      DEBUG: ${DEBUG:-true}
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: northwind-frontend
    environment:
      VITE_API_URL: http://localhost:8000/api/v1
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

---

## Verification Checklist

- [ ] Project directory structure created
- [ ] docker-compose.yml is valid (`docker-compose config`)
- [ ] PostgreSQL container starts successfully
- [ ] Database 'northwind' exists
- [ ] .env.example file exists with all variables
- [ ] .gitignore includes all necessary patterns
- [ ] README.md has clear setup instructions

---

## Next Step
Proceed to [Prompt 02: Database Setup with SQLAlchemy & Alembic](./02-database-setup.md)
