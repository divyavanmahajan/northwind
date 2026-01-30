# Northwind Web Application - Implementation Blueprint

## Overview

This document provides a detailed, step-by-step implementation plan for the Northwind Web Application. The plan is broken down into **6 Phases** containing **30 Implementation Prompts**, each designed to be small, testable, and building incrementally on previous work.

## Implementation Philosophy

1. **Test-Driven Development**: Each step writes tests before/alongside implementation
2. **Incremental Progress**: Small commits that always leave the codebase in a working state
3. **No Orphaned Code**: Every piece of code is integrated before moving on
4. **Vertical Slices**: Complete features from database to UI when possible
5. **Early Integration**: Wire components together quickly to catch integration issues

## Phase Overview

| Phase | Name | Prompts | Duration |
|-------|------|---------|----------|
| 1 | Foundation & Infrastructure | 01-05 | ~3 days |
| 2 | Authentication & Users | 06-10 | ~3 days |
| 3 | Core Entities (Products, Categories, Suppliers) | 11-16 | ~4 days |
| 4 | Business Entities (Customers, Orders, Employees) | 17-22 | ~5 days |
| 5 | Advanced Features & Dashboards | 23-26 | ~3 days |
| 6 | Polish, Testing & Deployment | 27-31 | ~4 days |

## Prompt Index

### Phase 1: Foundation & Infrastructure
- **Prompt 01**: Project Setup & Docker Configuration
- **Prompt 02**: Database Setup with SQLAlchemy & Alembic
- **Prompt 03**: FastAPI Base Configuration & Health Endpoint
- **Prompt 04**: React + Vite Frontend Scaffold
- **Prompt 05**: Frontend-Backend Integration & CORS

### Phase 2: Authentication & Users
- **Prompt 06**: User Model & Password Security
- **Prompt 07**: JWT Authentication Endpoints
- **Prompt 08**: Auth Middleware & Protected Routes (Backend)
- **Prompt 09**: Frontend Auth Store & Login Page
- **Prompt 10**: Protected Routes & Role-Based UI

### Phase 3: Core Entities
- **Prompt 11**: Categories CRUD (Backend)
- **Prompt 12**: Categories UI Components
- **Prompt 13**: Suppliers CRUD (Backend)
- **Prompt 14**: Suppliers UI Components
- **Prompt 15**: Products CRUD with Relationships (Backend)
- **Prompt 16**: Products UI with Search, Filter, Sort, Pagination

### Phase 4: Business Entities
- **Prompt 17**: Customers CRUD (Backend)
- **Prompt 18**: Customers UI Components
- **Prompt 19**: Employees CRUD (Backend)
- **Prompt 20**: Employees UI Components
- **Prompt 21**: Orders & Order Details CRUD (Backend)
- **Prompt 22**: Orders UI with Detail View

### Phase 5: Advanced Features & Dashboards
- **Prompt 23**: Data Seeding Scripts
- **Prompt 24**: Dashboard API Endpoints
- **Prompt 25**: Dashboard UI Components with Charts
- **Prompt 26**: User Management (Admin)

### Phase 6: Polish, Testing & Deployment
- **Prompt 27**: E2E Test Setup (Playwright)
- **Prompt 28**: Backend Coverage & Final Tests
- **Prompt 29**: UI Polish & Error Handling
- **Prompt 30**: Storybook Integration
- **Prompt 31**: Docker Production & Documentation

---

## Technical Architecture Summary

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│  - shadcn/ui + Tailwind CSS             │
│  - TanStack Query + Zustand             │
│  - React Hook Form + Zod                │
└──────────────┬──────────────────────────┘
               │ REST API + JWT
               │
┌──────────────▼──────────────────────────┐
│         FastAPI Backend                  │
│  - SQLAlchemy 2.0 ORM                    │
│  - Pydantic Validation                   │
│  - JWT Auth + RBAC                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         PostgreSQL Database              │
│  - Northwind Schema                      │
│  - User & Auth Tables                    │
└─────────────────────────────────────────┘
```

---

## Directory Structure (Final)

```
northwind-test/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── auth/
│   │   └── utils/
│   ├── scripts/
│   │   └── seed_database.py
│   ├── data/
│   │   └── *.csv
│   └── tests/
│       ├── conftest.py
│       ├── unit/
│       └── integration/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── lib/
│   └── e2e/
└── docs/
    ├── specification.md
    └── implementation/
```

---

## Key Dependencies

### Backend (requirements.txt)
- fastapi>=0.109.0
- uvicorn[standard]>=0.27.0
- sqlalchemy>=2.0.0
- alembic>=1.13.0
- psycopg2-binary>=2.9.0
- pydantic>=2.0.0
- python-jose[cryptography]>=3.3.0
- passlib[bcrypt]>=1.7.0
- pytest>=8.0.0
- pytest-asyncio>=0.23.0
- httpx>=0.26.0

### Frontend (package.json)
- react>=18.0.0
- vite>=5.0.0
- typescript>=5.0.0
- tailwindcss>=3.0.0
- @tanstack/react-query>=5.0.0
- react-hook-form>=7.0.0
- zustand>=4.0.0
- react-router-dom>=6.0.0
- zod>=3.0.0
- chart.js>=4.0.0

---

## How to Use These Prompts

1. **Read the entire prompt** before starting implementation
2. **Follow TDD**: Write tests first when indicated
3. **Verify each step**: Run tests and manually verify before moving on
4. **Commit frequently**: After each major section completion
5. **Reference previous prompts** if you need context
6. **Do not skip steps**: Each prompt builds on the previous ones

---

**Tracking**: Each implementation step is tracked as a bead. See [status/progress-implementation.md](./status/progress-implementation.md) for the step-to-bead mapping and status. Use `bd list` / `bd show <id>` to view in beads.

**Next Step**: Begin with [Prompt 01: Project Setup & Docker Configuration](./01-project-setup.md)
