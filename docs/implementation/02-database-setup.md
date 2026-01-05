# Prompt 02: Database Setup with SQLAlchemy & Alembic

## Context
Building on the Docker setup from Prompt 01, we now configure SQLAlchemy ORM and Alembic for database migrations. This establishes the foundation for all data models.

## Prerequisites
- Completed Prompt 01 (Docker & Project Structure)
- PostgreSQL container running

## Goals
1. Configure SQLAlchemy 2.0 with async support
2. Set up Alembic for database migrations
3. Create base model class with common fields
4. Establish database connection patterns
5. Write initial migration

---

## Prompt

```text
Set up SQLAlchemy 2.0 ORM and Alembic migrations for the Northwind backend.

DEPENDENCIES:
Update backend/requirements.txt to add:
- sqlalchemy>=2.0.0
- alembic>=1.13.0
- psycopg2-binary>=2.9.0
- pydantic>=2.0.0
- pydantic-settings>=2.0.0

DATABASE CONNECTION (backend/app/database.py):
Create database connection module with:
1. SQLAlchemy engine using create_engine (sync for simplicity)
2. SessionLocal factory using sessionmaker
3. Base declarative class for models
4. get_db() dependency function that yields session and handles cleanup

Use environment variable DATABASE_URL for connection string.

CONFIG MODULE (backend/app/config.py):
Create Pydantic Settings class for configuration:
1. Use pydantic_settings.BaseSettings
2. Read from environment variables
3. Include: DATABASE_URL, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION, DEBUG
4. Add model_config with env_file=".env"

Create a 'settings' instance for import throughout app.

BASE MODEL (backend/app/models/base.py):
Create a base mixin class with common timestamp fields:
- created_at: DateTime, default=now, not nullable
- updated_at: DateTime, default=now, onupdate=now, not nullable

Create a SoftDeleteMixin with:
- deleted_at: DateTime, nullable, default=None

ALEMBIC SETUP:
1. Initialize Alembic in backend directory: alembic init alembic
2. Modify alembic/env.py to:
   - Import your Base from app.database
   - Import all models (will be created later)
   - Use DATABASE_URL from environment
   - Set target_metadata = Base.metadata
3. Update alembic.ini:
   - Remove hardcoded sqlalchemy.url (use env.py override)

INITIAL MIGRATION:
Create an initial migration that:
1. Just verifies the database connection works
2. Creates no tables yet (placeholder)
Run: alembic revision -m "initial_setup"

MAIN APP UPDATE (backend/app/main.py):
Create minimal FastAPI app that:
1. Imports settings from config
2. Has a root "/" endpoint returning {"status": "ok", "message": "Northwind API"}
3. Prints DATABASE_URL (masked) on startup for verification

TESTS:
Create backend/tests/conftest.py with:
1. Test database configuration (can use same DB or SQLite for unit tests)
2. Session fixture
3. Client fixture using TestClient

Create backend/tests/unit/test_database.py with tests:
1. test_database_connection - verify connection works
2. test_session_creation - verify SessionLocal creates sessions

VERIFICATION:
1. Rebuild backend container: docker-compose up -d --build backend
2. Check logs: docker-compose logs backend
3. Visit http://localhost:8000 - should see JSON response
4. Run: docker-compose exec backend alembic current - should show current revision

SUCCESS CRITERIA:
- FastAPI app starts without errors
- Database connection established
- Alembic initialized and can run migrations
- Basic tests pass: docker-compose exec backend pytest tests/unit/test_database.py
```

---

## Expected File Structure

```
backend/
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── xxxx_initial_setup.py
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   └── models/
│       ├── __init__.py
│       └── base.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    └── unit/
        ├── __init__.py
        └── test_database.py
```

---

## Key Code Snippets

### backend/app/config.py
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str = "development_secret_key_min_32_chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 86400
    DEBUG: bool = True
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
```

### backend/app/database.py
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Verification Checklist

- [ ] requirements.txt updated with all dependencies
- [ ] Config module reads environment variables correctly
- [ ] Database connection established successfully
- [ ] Alembic initialized and configured
- [ ] Initial migration created
- [ ] FastAPI root endpoint works
- [ ] Database tests pass

---

## Next Step
Proceed to [Prompt 03: FastAPI Base Configuration & Health Endpoint](./03-fastapi-base.md)
