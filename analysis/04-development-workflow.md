# Development Workflow

## Quick Start

### With Docker (Recommended)

```bash
# 1. Clone and configure
cp .env.example .env          # edit if needed

# 2. Start all services
docker-compose up -d

# 3. Access
# Frontend:  http://localhost:5173
# API:       http://localhost:8000
# API docs:  http://localhost:8000/docs
```

### Using the Helper Script

```bash
./scripts/local-dev.sh start     # start everything
./scripts/local-dev.sh stop      # stop everything
./scripts/local-dev.sh status    # check service health
./scripts/local-dev.sh restart   # restart all

./scripts/local-dev.sh backend-start   # backend only
./scripts/local-dev.sh frontend-start  # frontend only
```

Frontend logs: `logs/frontend.log`
Backend logs: `docker-compose logs -f backend`

---

## Running Tests

### Backend
```bash
docker-compose exec backend pytest
docker-compose exec backend pytest --cov=app --cov-report=html
docker-compose exec backend pytest tests/unit/test_products.py
```

### Frontend Unit Tests (Vitest)
```bash
cd frontend
npm run test
```

### Frontend E2E Tests (Playwright)
```bash
cd frontend
npm run test:e2e
npm run test:e2e:ui      # with Playwright UI
npm run test:e2e:headed  # with visible browser
```

### Coverage Targets
| Layer | Minimum |
|-------|---------|
| Backend | 80% |
| Frontend | 70% |

---

## Code Quality Gates

Run these before committing:

### Backend
```bash
black backend/app/         # auto-format
flake8 backend/app/        # lint
mypy backend/app/          # type check
bandit -r backend/app/     # security scan
```

### Frontend
```bash
cd frontend
npm run lint               # ESLint
npm run type-check         # tsc --noEmit
npm run build              # production build check
```

---

## Git Workflow

### Branch Strategy
```
main              ← Production-ready code
  └── develop     ← Integration branch (optional)
        └── feature/xyz    ← Feature branches
        └── bugfix/xyz     ← Bug fix branches
        └── hotfix/xyz     ← Urgent fixes
```

### Branch Naming
| Prefix | Use Case |
|--------|---------|
| `feature/` | New features |
| `bugfix/` | Bug fixes |
| `hotfix/` | Production fixes |
| `docs/` | Documentation |
| `refactor/` | Refactoring |
| `test/` | Test additions |

Format: `type/short-description` or `type/issue-number-description`
Use lowercase and hyphens. Example: `feature/42-product-search`

### Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Scopes:** `backend`, `frontend`, `db`, `auth`, `products`, `orders`, `users`, `docker`, `deps`

**Subject rules:**
- Imperative mood: "add feature" not "added feature"
- No capital first letter
- No trailing period
- Under 50 characters

**Examples:**
```bash
git commit -m "feat(products): add product search functionality"
git commit -m "fix(orders): correct order total calculation"
git commit -m "docs: update API endpoint documentation"
git commit -m "chore(deps): update fastapi to v0.109.0"
git commit -m "feat(api)!: change authentication header format"  # breaking change
```

---

## Pull Request Process

**Before opening a PR:**
- [ ] All tests pass
- [ ] Code style checks pass
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with target branch

**PR title** — same format as commit messages: `feat(products): add product search`

**PR description template:**
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation

## Testing
Describe testing done.

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

**Review:** 1 approval required; all CI checks must pass.

---

## Database Management

### Reset database
```bash
docker-compose down
docker volume rm northwind-test_postgres_data
docker-compose up -d
```

### Migrations
```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "add column foo"

# Apply all pending migrations
docker-compose exec backend alembic upgrade head

# Rollback last migration
docker-compose exec backend alembic downgrade -1
```

**Important:** Only modify Alembic-managed application tables. The legacy seed tables (`customer`, `product`, etc.) are read-only data sources.

---

## Issue Tracking (Beads)

This project uses **Beads** (`bd`) for issue tracking — issues are stored as JSONL files in `.beads/` and synced with git.

```bash
bd ready              # find available work
bd show <id>          # view issue details
bd update <id> --status in_progress   # claim work
bd close <id>         # complete work
bd sync               # sync with git remote
```

See `AGENTS.md` for the mandatory session-completion workflow (must push before finishing work).

---

## Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable | Description |
|----------|-------------|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection |
| `JWT_SECRET` | Token signing key — generate with `openssl rand -hex 32` |
| `JWT_EXPIRATION` | Token lifetime in seconds (default: 86400) |
| `DEBUG` | Set `false` in production |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `VITE_API_URL` | Backend URL for frontend build |
| `FRONTEND_PORT` | Port for production frontend container |

---

## Adding a New Module

When adding a new business entity (e.g., "Invoices"):

1. **Backend:**
   - Create `backend/app/models/invoice.py` (SQLAlchemy model)
   - Create `backend/app/schemas/invoice.py` (Pydantic schemas)
   - Create `backend/app/services/invoice_service.py` (business logic)
   - Create `backend/app/routers/invoices.py` (route handlers)
   - Register router in `main.py`
   - Generate and apply Alembic migration

2. **Frontend:**
   - Create `frontend/src/services/invoiceService.ts`
   - Create `frontend/src/hooks/useInvoices.ts`
   - Create `frontend/src/schemas/invoiceSchema.ts` (Zod)
   - Add page components in `frontend/src/pages/`
   - Add route in `App.tsx`
   - Add nav item in `Sidebar.tsx`

3. **Tests:**
   - Backend: `backend/tests/unit/test_invoice_service.py` + integration tests
   - Frontend: unit tests + E2E tests
