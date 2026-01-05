from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

def test_health_ready():
    # This might fail if DB is not mockable/reachable in unit tests environment easily without docker.
    # However, the prompt says "GET /api/v1/health/ready returns 200 and DB status"
    # In unit tests, we might mock the DB session or dependency.
    # But for now let's try calling it. If it fails due to no DB, I might need to mock.
    
    # Since I am in "unit" tests, I should probably mock the get_db dependency or the DB execution.
    # But usually "unit" in these prompts might mean "tests that run quickly", sometimes effectively integration.
    # Let's see if I can mock the dependency.
    
    response = client.get("/api/v1/health/ready")
    # It might return 200 with "unhealthy" if DB is down, or 200 with "healthy" if up.
    # The code returns 200 in both cases?
    # No, the code returns { "status": ... }. Status code is default 200.
    
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "checks" in data
    assert "database" in data["checks"]

def test_not_found():
    response = client.get("/api/v1/nonexistent")
    assert response.status_code == 404
    data = response.json()
    # Check error format
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND" # Wait, 404 default handler by FastAPI?
    # I didn't override the default 404 handler in main.py, I only handled 'AppException'.
    # If I want standard 404 to follow my format, I should override http_exception_handler or specific 404.
    
    # The prompt said: "test_not_found - GET /nonexistent returns 404 with proper error format"
    # And: "Generic Exception - return 500".
    
    # If I access a non-existent route, FastAPI raises a Starlette HTTPException(404).
    # I haven't added a handler for Starlette HTTPException.
    # I should check if I missed that.
    
    # Prompt: "Set up consistent error handling ... Exception handlers: 1. AppException ... 2. RequestValidationError ... 3. Generic Exception"
    # It DOES NOT explicitly say "Handle 404".
    # BUT "test_not_found ... returns 404 with proper error format" implies I should handle it?
    # Or maybe `AppException` is not raised for 404 on route not found.
    
    # Let's see if I should add a handler for Starlette HTTPException or just ignore format for now?
    # The prompt specifically asks for "proper error format" for 404.
    # I'll update main.py to handle Starlette HTTPException as well, to be safe.
