# Northwind Web Application

A modern web application based on the classic Northwind database, built with FastAPI, React (Vite), and PostgreSQL.

## Prerequisites

- Docker and Docker Compose
- Node.js (for local frontend development without Docker)
- Python 3.11+ (for local backend development without Docker)

## Project Structure

- `backend/`: FastAPI application
- `frontend/`: React application (Vite)
- `docs/`: Project documentation and implementation steps

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and adjust if needed:
   ```bash
   cp .env.example .env
   ```
3. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Services and Ports

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432

## Development

### Backend

The backend is mounted as a volume, so changes to `backend/app` will trigger a reload.

### Frontend

The frontend is mounted as a volume. Run `npm install` inside the container or locally to manage dependencies.
