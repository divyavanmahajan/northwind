# AI Agent Guide

This file contains conventions and rules specifically for AI coding assistants working in this repository.

## Mandatory Session Rules (from AGENTS.md)

**When ending a work session, ALL steps below are required. Work is NOT complete until `git push` succeeds.**

1. **File issues** for any remaining work that needs follow-up
2. **Run quality gates** (if code changed): tests, linters, builds
3. **Update issue status** in Beads — close finished work, update in-progress items
4. **Push to remote** (MANDATORY):
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** — clear stashes, prune remote branches
6. **Verify** — all changes committed AND pushed
7. **Hand off** — provide context for the next session

**Critical rules:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing — that leaves work stranded locally
- If push fails, resolve and retry until it succeeds

## Issue Tracking (Beads)

This project uses **Beads (`bd`)** — a CLI-native, git-integrated issue tracker.

```bash
bd onboard            # get started
bd ready              # find available work
bd show <id>          # view issue details
bd list               # list all issues
bd create "title"     # create new issue
bd update <id> --status in_progress   # claim work
bd close <id>         # mark complete
bd sync               # sync with git remote
```

Issues are stored in `.beads/issues.jsonl` and committed with code.

**Note on `bd doctor` warnings:**
- "Claude Integration: Not configured" — ignore; this project uses Cursor
- "Sync Branch Config: not configured" — optional; only needed for multi-clone setups

## Code Style Quick Reference

### Python (Backend)
- Type hints on all function signatures
- Docstrings on public functions/classes
- Keep functions under ~50 lines
- Use `AppException` for business errors, not raw `HTTPException`
- All new tables need `created_at`, `updated_at`, `deleted_at` columns
- Only modify Alembic-managed tables (never touch legacy seed tables)

### TypeScript (Frontend)
- Functional components only (no class components)
- Named exports for all components
- TypeScript interfaces for all props and data types
- Zod schemas for form validation
- TanStack Query for server state; Zustand only for UI/client state
- `cn()` helper for conditional Tailwind classes

## Commit Convention Quick Reference

```
feat(scope): add something new
fix(scope): fix a bug
docs: update documentation
test(scope): add tests
refactor(scope): refactor code
chore: maintenance tasks
```

Scopes: `backend`, `frontend`, `db`, `auth`, `products`, `orders`, `users`, `docker`, `deps`

## Running Quality Checks Before Committing

```bash
# Backend
docker-compose exec backend pytest
black backend/app/ && flake8 backend/app/ && mypy backend/app/

# Frontend
cd frontend && npm run lint && npm run type-check && npm run build
```

## Where Things Live

| Thing | Location |
|-------|----------|
| API route handlers | `backend/app/routers/` |
| Business logic | `backend/app/services/` |
| DB models | `backend/app/models/` |
| Pydantic schemas | `backend/app/schemas/` |
| App config / env | `backend/app/config.py` |
| DB migrations | `backend/alembic/versions/` |
| Frontend pages | `frontend/src/pages/` |
| API service calls | `frontend/src/services/` |
| Custom React hooks | `frontend/src/hooks/` |
| Global state | `frontend/src/store/` |
| Form schemas (Zod) | `frontend/src/schemas/` |
| TypeScript types | `frontend/src/types/` |
| UI primitives | `frontend/src/components/ui/` |
| Feature components | `frontend/src/components/features/` |
| Layout components | `frontend/src/components/layout/` |
| Backend tests | `backend/tests/` |
| Frontend unit tests | `frontend/src/__tests__/` |
| E2E tests | `frontend/e2e/` |

## Common Patterns

### Adding a Backend Endpoint

1. Add model in `models/` (inherit from `Base` with audit columns)
2. Add Pydantic schemas in `schemas/` (`Create`, `Update`, `Response`, `List`)
3. Add service in `services/` (constructor takes `db: Session`)
4. Add router in `routers/` (register in `main.py`)
5. Create Alembic migration

### Adding a Frontend Module

1. Add service in `services/xyzService.ts`
2. Add hooks in `hooks/useXyz.ts` (wrap TanStack Query)
3. Add Zod schemas in `schemas/xyzSchema.ts`
4. Add pages in `pages/` (list, detail, form)
5. Add route in `App.tsx`
6. Add nav item in `components/layout/Sidebar.tsx`

### Error Handling Pattern

**Backend:** Raise `AppException(status_code, code, message)` from services. The global handler in `main.py` maps it to the standard JSON error envelope.

**Frontend:** Catch errors from TanStack Query mutations:
```ts
onError: (error) => toast.error(error.response?.data?.error?.message ?? 'An error occurred')
```

## Documentation Map

| Topic | Location |
|-------|----------|
| Full project overview | `README.md` |
| API endpoint reference | `docs/api.md` |
| Database schema details | `docs/database.md` |
| Git workflow + commit conventions | `docs/developer-guidelines.md` |
| Deployment instructions | `docs/deployment.md` |
| Implementation history | `docs/implementation/` |
| Agent session rules | `AGENTS.md` |
| Beads issue tracking | `.beads/README.md` |
| AI agent rules (Cursor) | `.agent/rules/development-guidelines.md` |
