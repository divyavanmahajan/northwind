# Project Overview

## What Is This?

Northwind is a full-stack business management web application based on the classic Microsoft Northwind sample database. It demonstrates modern web development practices with a FastAPI backend and a React/TypeScript frontend.

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  React Frontend │─────▶│ FastAPI Backend  │─────▶│   PostgreSQL    │
│   (Vite + TS)   │      │  (Python 3.11)  │      │   Database      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
     :5173 (dev)               :8000                    :5432
     :80 (prod)
```

Production adds Nginx in front of the frontend container, which reverse-proxies `/api/` to the backend.

## Tech Stack

### Backend
| Tool | Purpose |
|------|---------|
| FastAPI (Python 3.11) | REST API framework |
| SQLAlchemy ORM | Database access layer |
| Alembic | Schema migrations |
| Pydantic v2 | Request/response validation |
| PyJWT | JWT authentication |
| Pytest | Backend testing (target: 80% coverage) |
| Gunicorn + Uvicorn | Production WSGI/ASGI server |

### Frontend
| Tool | Purpose |
|------|---------|
| React 19 + TypeScript | UI framework |
| Vite 7 | Build tooling and dev server |
| Tailwind CSS 4 | Styling |
| Radix UI | Accessible component primitives |
| TanStack Query v5 | Server state / data fetching |
| Zustand v5 | Client state management |
| React Hook Form + Zod | Forms and validation |
| React Router v7 | Client-side routing |
| Chart.js / react-chartjs-2 | Data visualization |
| Vitest | Unit testing |
| Playwright | End-to-end testing |
| Storybook 10 | Component documentation |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Docker + Docker Compose | Containerization |
| PostgreSQL 15 | Database |
| Nginx | Production static file serving + API proxy |

## Business Modules

| Module | Description |
|--------|-------------|
| Auth | JWT login, role-based access (Admin / Manager / Employee) |
| Dashboard | Role-specific analytics, charts, KPIs |
| Categories | Product category management |
| Suppliers | Supplier CRUD |
| Products | Product catalog with filtering, search, pagination |
| Customers | Customer relationship management |
| Employees | Employee directory and management |
| Orders | Order processing, status workflow, order details |
| Users | User account management (admin only) |

## Repository Structure

```
northwind/
├── backend/
│   ├── app/
│   │   ├── api/          # (unused – routers dir is used instead)
│   │   ├── auth/         # JWT helpers
│   │   ├── core/         # Config + security utilities
│   │   ├── middleware/   # Request logging middleware
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── routers/      # FastAPI route handlers
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Business logic layer
│   │   ├── utils/        # Shared utilities & custom exceptions
│   │   ├── config.py     # Settings (loaded from env)
│   │   ├── database.py   # SQLAlchemy engine + session factory
│   │   └── main.py       # App factory, middleware, routers
│   ├── tests/
│   │   ├── unit/         # Unit tests
│   │   └── integration/  # Integration tests
│   ├── alembic/          # DB migration scripts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── hooks/        # Custom React hooks (API integration)
│   │   ├── lib/          # Utilities (cn, api client)
│   │   ├── pages/        # Page-level components
│   │   ├── schemas/      # Zod validation schemas
│   │   ├── services/     # API service functions
│   │   ├── store/        # Zustand stores
│   │   ├── stories/      # Storybook stories
│   │   ├── types/        # TypeScript type definitions
│   │   └── main.tsx      # App entry point
│   └── package.json
├── docs/                 # Detailed documentation
├── analysis/             # AI assistant documentation (this folder)
├── scripts/              # Dev helper scripts
├── .beads/               # Beads issue tracking data
├── .agent/               # AI agent rules
├── docker-compose.yml    # Development Docker Compose
├── docker-compose.prod.yml  # Production Docker Compose
└── .env.example          # Environment variable template
```

## Default Test Credentials

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@northwind.com | Admin123! |
| Manager | manager@northwind.com | Manager123! |
| Employee | employee@northwind.com | Employee123! |

## Key URLs (Development)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Storybook | http://localhost:6007 |
