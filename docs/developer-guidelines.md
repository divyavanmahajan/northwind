# Developer Guidelines

This document outlines the development standards and practices for the Northwind Web Application project. All contributors should follow these guidelines to maintain code quality and consistency.

---

## Table of Contents

1. [Git Workflow](#git-workflow)
2. [Commit Message Conventions](#commit-message-conventions)
3. [Branch Naming](#branch-naming)
4. [Code Style Guidelines](#code-style-guidelines)
5. [Testing Requirements](#testing-requirements)
6. [Pull Request Process](#pull-request-process)
7. [Documentation Standards](#documentation-standards)

---

## Git Workflow

### Development Process

1. **Create a feature branch** from `main` or `develop`
2. **Make incremental commits** that keep the codebase in a working state
3. **Write tests** alongside your implementation
4. **Push your branch** and create a Pull Request
5. **Address review feedback** before merging

### Branch Strategy

```
main              ← Production-ready code
  └── develop     ← Integration branch
        └── feature/xyz    ← Feature branches
        └── bugfix/xyz     ← Bug fix branches
        └── hotfix/xyz     ← Urgent production fixes
```

---

## Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This enables automatic changelog generation and makes the git history easier to navigate.

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                             |
|------------|---------------------------------------------------------|
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Code style changes (formatting, semicolons, etc.)       |
| `refactor` | Code refactoring (no feature change or bug fix)         |
| `perf`     | Performance improvements                                |
| `test`     | Adding or updating tests                                |
| `build`    | Build system or external dependency changes             |
| `ci`       | CI/CD configuration changes                             |
| `chore`    | Other changes that don't modify src or test files       |
| `revert`   | Reverts a previous commit                               |

### Scope (Optional)

The scope provides additional context about what part of the codebase is affected:

- `backend` - Backend/API changes
- `frontend` - Frontend/UI changes
- `db` - Database schema or migration changes
- `auth` - Authentication/authorization changes
- `products` - Product-related features
- `orders` - Order-related features
- `users` - User management features
- `docker` - Docker configuration changes
- `deps` - Dependency updates

### Subject Guidelines

- Use the **imperative mood** ("add feature" not "added feature")
- Don't capitalize the first letter
- No period at the end
- Keep it under **50 characters**

### Examples

```bash
# Feature commits
git commit -m "feat(products): add product search functionality"
git commit -m "feat(auth): implement JWT token refresh"
git commit -m "feat(frontend): add dashboard charts"

# Bug fix commits
git commit -m "fix(orders): correct order total calculation"
git commit -m "fix(auth): handle expired token gracefully"

# Documentation commits
git commit -m "docs: update API endpoint documentation"
git commit -m "docs(readme): add setup instructions"

# Refactoring commits
git commit -m "refactor(backend): extract validation logic to service layer"

# Test commits
git commit -m "test(products): add unit tests for product service"
git commit -m "test(e2e): add login flow tests"

# Chore commits
git commit -m "chore(deps): update fastapi to v0.109.0"
git commit -m "chore: update .gitignore"
```

### Multi-line Commit Messages

For complex changes, include a body with more details:

```bash
git commit -m "feat(orders): implement order status workflow

- Add status transitions (pending → processing → shipped → delivered)
- Implement status change validation
- Add status history tracking
- Send notifications on status change

Closes #42"
```

### Breaking Changes

Use `!` after the type/scope for breaking changes:

```bash
git commit -m "feat(api)!: change authentication header format

BREAKING CHANGE: The Authorization header now requires 'Bearer ' prefix.
Old format: Authorization: <token>
New format: Authorization: Bearer <token>"
```

---

## Branch Naming

### Format

```
<type>/<short-description>
```

### Types

| Prefix     | Use Case                        |
|------------|--------------------------------|
| `feature/` | New features                    |
| `bugfix/`  | Bug fixes                       |
| `hotfix/`  | Urgent production fixes         |
| `docs/`    | Documentation updates           |
| `refactor/`| Code refactoring                |
| `test/`    | Test additions/improvements     |

### Examples

```bash
feature/product-search
feature/jwt-refresh-token
bugfix/order-total-calculation
hotfix/login-security-patch
docs/api-documentation
refactor/user-service
test/e2e-auth-flow
```

### Guidelines

- Use **lowercase** letters
- Use **hyphens** to separate words
- Keep names **short but descriptive**
- Include ticket/issue number if applicable: `feature/42-product-search`

---

## Code Style Guidelines

### Backend (Python)

We follow **PEP 8** with the following tools:

```bash
# Formatting
black backend/

# Linting
flake8 backend/

# Type checking
mypy backend/

# Security scanning
bandit -r backend/
```

**Key conventions:**
- Use type hints for function parameters and return types
- Document public functions with docstrings
- Keep functions focused and under 50 lines
- Use meaningful variable names

### Frontend (TypeScript/React)

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

**Key conventions:**
- Use functional components with hooks
- Define TypeScript interfaces for props and data types
- Use named exports for components
- Keep components focused and composable

---

## Testing Requirements

### Coverage Targets

| Component | Minimum Coverage |
|-----------|-----------------|
| Backend   | 80%             |
| Frontend  | 70%             |

### Test Types

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test API endpoints and database operations
3. **E2E Tests** - Test complete user workflows (Playwright)

### Running Tests

```bash
# Backend tests
docker-compose exec backend pytest
docker-compose exec backend pytest --cov=app --cov-report=html

# Frontend unit tests
cd frontend && npm run test

# E2E tests
cd frontend && npm run test:e2e
```

### Test-Driven Development

Follow TDD when possible:
1. Write a failing test
2. Implement the minimum code to pass
3. Refactor while keeping tests green

---

## Pull Request Process

### Before Creating a PR

- [ ] All tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with target branch

### PR Title Format

Use the same format as commit messages:

```
feat(products): add product search functionality
```

### PR Description Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation update
- [ ] Other (specify)

## Testing
Describe testing done.

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. At least **one approval** required
2. All CI checks must pass
3. Address all review comments
4. Squash commits if requested

---

## Documentation Standards

### Code Documentation

- **Backend**: Use docstrings for functions and classes
- **Frontend**: Use JSDoc comments for complex logic
- **Inline comments**: Explain *why*, not *what*

### Project Documentation

Update these documents when relevant:
- `README.md` - Project overview and quick start
- `docs/` - Detailed documentation
- API documentation (auto-generated from FastAPI)

### Markdown Guidelines

- Use proper heading hierarchy (`#`, `##`, `###`)
- Include code blocks with language specification
- Use tables for structured data
- Keep lines under 120 characters

---

## Quick Reference

### Commit Cheat Sheet

```bash
# Basic feature
git commit -m "feat: add new feature"

# Feature with scope
git commit -m "feat(backend): add user authentication"

# Bug fix
git commit -m "fix: resolve login issue"

# Documentation
git commit -m "docs: update README"

# Breaking change
git commit -m "feat!: change API response format"
```

### Common Commands

```bash
# Start development environment
docker-compose up -d

# Run backend tests
docker-compose exec backend pytest

# Run frontend tests
cd frontend && npm run test

# Check code style
black backend/ && flake8 backend/
cd frontend && npm run lint

# Create migration
docker-compose exec backend alembic revision --autogenerate -m "description"
```

---

**Last Updated**: January 2026
