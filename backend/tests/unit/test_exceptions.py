import pytest
from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient
from app.utils.exceptions import (
    AppException, NotFoundError, ValidationError, 
    AuthenticationError, AuthorizationError, ConflictError
)
from app.main import app as main_app

# Create a new app for testing exceptions to avoid modifying the main app with test routes
# BUT we need the exception handlers.
# So we can just add a router to the main_app and then remove it? 
# Or just use main_app.

test_router = APIRouter(prefix="/test-exceptions")

@test_router.get("/app_exception")
def raise_app_exception():
    raise AppException(message="Generic error", code="TEST_ERROR", status_code=418)

@test_router.get("/not_found")
def raise_not_found():
    raise NotFoundError(message="Resource not found")

@test_router.get("/validation")
def raise_validation():
    raise ValidationError(message="Invalid input", details=[{"field": "x", "msg": "bad"}])

@test_router.get("/auth")
def raise_auth():
    raise AuthenticationError(message="Not authenticated")

@test_router.get("/forbidden")
def raise_forbidden():
    raise AuthorizationError(message="Not authorized")

@test_router.get("/conflict")
def raise_conflict():
    raise ConflictError(message="Conflict exists")

main_app.include_router(test_router)

client = TestClient(main_app)

def test_app_exception():
    response = client.get("/test-exceptions/app_exception")
    assert response.status_code == 418
    data = response.json()
    assert data["error"]["code"] == "TEST_ERROR"
    assert data["error"]["message"] == "Generic error"

def test_not_found_exception():
    response = client.get("/test-exceptions/not_found")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "NOT_FOUND"
    assert data["error"]["message"] == "Resource not found"

def test_validation_exception():
    response = client.get("/test-exceptions/validation")
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert data["error"]["details"][0]["field"] == "x"

def test_auth_exception():
    response = client.get("/test-exceptions/auth")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "AUTHENTICATION_ERROR"

def test_forbidden_exception():
    response = client.get("/test-exceptions/forbidden")
    assert response.status_code == 403
    data = response.json()
    assert data["error"]["code"] == "AUTHORIZATION_ERROR"

def test_conflict_exception():
    response = client.get("/test-exceptions/conflict")
    assert response.status_code == 409
    data = response.json()
    assert data["error"]["code"] == "CONFLICT_ERROR"
