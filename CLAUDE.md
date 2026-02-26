# CLAUDE.md — Northwind Codebase Guide

This file is the entry point for AI assistants. It gives a brief orientation and points to detailed files in `analysis/`.

---

## What Is This Project?

A full-stack business management web application based on the Northwind sample database. Built with **FastAPI** (Python) backend, **React + TypeScript** (Vite) frontend, and **PostgreSQL**. It demonstrates modern CRUD, JWT auth, role-based access, and data visualization.

**Quick start:** `docker-compose up -d` → http://localhost:5173 (frontend), http://localhost:8000/docs (API)

---

## Detailed Documentation

| Topic | File |
|-------|------|
| Architecture, tech stack, module map | [`analysis/01-project-overview.md`](analysis/01-project-overview.md) |
| Backend (FastAPI, models, services, routers, auth, tests) | [`analysis/02-backend.md`](analysis/02-backend.md) |
| Frontend (React, pages, hooks, state, components, tests) | [`analysis/03-frontend.md`](analysis/03-frontend.md) |
| Development workflow (setup, testing, git, conventions) | [`analysis/04-development-workflow.md`](analysis/04-development-workflow.md) |
| Database schema and migrations | [`analysis/05-database.md`](analysis/05-database.md) |
| Production deployment and Docker | [`analysis/06-deployment.md`](analysis/06-deployment.md) |
| AI agent rules, session workflow, Beads issue tracking | [`analysis/07-ai-agent-guide.md`](analysis/07-ai-agent-guide.md) |

Also see:
- [`README.md`](README.md) — project overview and quick-start
- [`AGENTS.md`](AGENTS.md) — **mandatory** session-completion workflow for agents
- [`docs/api.md`](docs/api.md) — full API endpoint reference
- [`docs/database.md`](docs/database.md) — schema modernization details
- [`docs/developer-guidelines.md`](docs/developer-guidelines.md) — git workflow, commit conventions
- [`docs/deployment.md`](docs/deployment.md) — production deployment guide

---

## Essential Commands

```bash
# Start development environment
docker-compose up -d

# Backend tests
docker-compose exec backend pytest

# Frontend tests
cd frontend && npm run test

# E2E tests
cd frontend && npm run test:e2e

# Code quality
black backend/app/ && flake8 backend/app/
cd frontend && npm run lint && npm run type-check

# Database migration
docker-compose exec backend alembic revision --autogenerate -m "description"
docker-compose exec backend alembic upgrade head
```

---

## Commit Convention (quick ref)

```
feat(scope): add new feature
fix(scope): fix a bug
docs: update docs
test(scope): add tests
```
Scopes: `backend`, `frontend`, `db`, `auth`, `products`, `orders`, `users`, `docker`, `deps`

---

## Mandatory for AI Agents

Before ending any session, you **must** push your work. See [`analysis/07-ai-agent-guide.md`](analysis/07-ai-agent-guide.md) and [`AGENTS.md`](AGENTS.md) for the full mandatory session-completion checklist.
