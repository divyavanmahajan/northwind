# Prompt 03: FastAPI Base Configuration & Health Endpoint

## Context
With the database connection established, we now build out the FastAPI application structure with proper configuration, middleware, exception handling, and API versioning.

## Prerequisites
- Completed Prompt 02 (Database Setup)
- Backend container running with database connection

## Goals
1. Structure FastAPI application properly
2. Add CORS middleware
3. Create API router with versioning (/api/v1)
4. Build health check endpoint
5. Set up consistent error handling
6. Add request logging middleware

---

## Prompt

```text
Build out the FastAPI application structure with proper middleware, error handling, and API organization.

APPLICATION STRUCTURE:
Reorganize backend/app/ into:
```
app/
├── __init__.py
├── main.py              # FastAPI app instance and startup
├── config.py            # Settings (already exists)
├── database.py          # DB connection (already exists)
├── models/
│   ├── __init__.py
│   └── base.py          # (already exists)
├── schemas/
│   ├── __init__.py
│   └── common.py        # Common response schemas
├── routers/
│   ├── __init__.py
│   └── health.py        # Health check router
├── middleware/
│   ├── __init__.py
│   └── logging.py       # Request logging middleware
└── utils/
    ├── __init__.py
    └── exceptions.py    # Custom exceptions
```

COMMON SCHEMAS (backend/app/schemas/common.py):
Create Pydantic models for:

1. PaginationParams - for query parameters:
   - page: int = 1 (min 1)
   - page_size: int = 25 (min 1, max 100)
   
2. PaginatedResponse[T] - generic paginated response:
   - data: List[T]
   - pagination: PaginationInfo
   
3. PaginationInfo:
   - page: int
   - page_size: int
   - total_items: int
   - total_pages: int
   - has_next: bool
   - has_previous: bool

4. MessageResponse:
   - message: str
   
5. ErrorDetail:
   - field: Optional[str]
   - message: str
   
6. ErrorResponse:
   - error: dict with:
     - code: str
     - message: str
     - details: Optional[List[ErrorDetail]]
     - timestamp: datetime
     - path: str

CUSTOM EXCEPTIONS (backend/app/utils/exceptions.py):
Create custom exception classes:

1. AppException(Exception) - base class with:
   - status_code: int
   - code: str
   - message: str
   - details: Optional[List[dict]]

2. NotFoundError(AppException) - 404
3. ValidationError(AppException) - 400
4. AuthenticationError(AppException) - 401
5. AuthorizationError(AppException) - 403
6. ConflictError(AppException) - 409

EXCEPTION HANDLERS:
In main.py, register exception handlers for:
1. AppException - return ErrorResponse
2. RequestValidationError - convert to ErrorResponse format
3. Generic Exception - return 500 with generic message (hide details in production)

LOGGING MIDDLEWARE (backend/app/middleware/logging.py):
Create middleware that logs:
1. Request method and path
2. Request processing time
3. Response status code
Use Python's logging module with structured format.

HEALTH ROUTER (backend/app/routers/health.py):
Create router with prefix "/health":

1. GET /health - basic health check
   Response: {"status": "healthy", "timestamp": "ISO datetime"}

2. GET /health/ready - readiness check (includes DB)
   - Test database connection
   Response: {
     "status": "healthy",
     "checks": {
       "database": {"status": "healthy", "latency_ms": 5}
     }
   }

MAIN APPLICATION (backend/app/main.py):
Update to include:
1. FastAPI instance with:
   - title="Northwind API"
   - description="Full-stack web application for Northwind database"
   - version="1.0.0"
   - docs_url="/docs"
   - redoc_url="/redoc"

2. CORS middleware configured for:
   - allow_origins=["http://localhost:5173", "http://localhost:3000"]
   - allow_credentials=True
   - allow_methods=["*"]
   - allow_headers=["*"]

3. Add logging middleware
4. Register all exception handlers
5. Create main router at /api/v1
6. Include health router

7. Startup event that:
   - Logs "Application starting..."
   - Verifies database connection

TESTS:
Create backend/tests/unit/test_health.py:
1. test_health_endpoint - GET /api/v1/health returns 200
2. test_health_ready - GET /api/v1/health/ready returns 200 and DB status
3. test_not_found - GET /nonexistent returns 404 with proper error format

Create backend/tests/unit/test_exceptions.py:
1. Test each custom exception class
2. Test exception to response conversion

VERIFICATION:
1. docker-compose up -d --build backend
2. curl http://localhost:8000/api/v1/health
3. curl http://localhost:8000/api/v1/health/ready
4. curl http://localhost:8000/api/v1/nonexistent (should return 404)
5. Visit http://localhost:8000/docs - OpenAPI docs
6. docker-compose exec backend pytest tests/unit/test_health.py

SUCCESS CRITERIA:
- Health endpoints return correct responses
- Error responses follow consistent format
- CORS headers present in responses
- Request timing logged
- OpenAPI documentation accessible at /docs
- All tests pass
```

---

## Key Code Patterns

### Exception Handler Example
```python
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path)
            }
        }
    )
```

### Health Check Example
```python
@router.get("/ready")
def health_ready(db: Session = Depends(get_db)):
    start = time.time()
    db.execute(text("SELECT 1"))
    latency = (time.time() - start) * 1000
    return {
        "status": "healthy",
        "checks": {
            "database": {"status": "healthy", "latency_ms": round(latency, 2)}
        }
    }
```

---

## Verification Checklist

- [ ] Application structure reorganized
- [ ] Common schemas created
- [ ] Custom exceptions defined
- [ ] Exception handlers registered
- [ ] CORS middleware configured
- [ ] Logging middleware working
- [ ] Health endpoints accessible
- [ ] OpenAPI docs available at /docs
- [ ] All tests pass

---

## Next Step
Proceed to [Prompt 04: React + Vite Frontend Scaffold](./04-frontend-scaffold.md)
