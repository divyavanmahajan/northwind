from typing import Optional, List, Dict, Any

class AppException(Exception):
    def __init__(
        self, 
        message: str, 
        code: str = "INTERNAL_ERROR", 
        status_code: int = 500, 
        details: Optional[List[Dict[str, Any]]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)

class NotFoundError(AppException):
    def __init__(self, message: str, details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            message=message, 
            code="NOT_FOUND", 
            status_code=404, 
            details=details
        )

class ValidationError(AppException):
    def __init__(self, message: str, details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            message=message, 
            code="VALIDATION_ERROR", 
            status_code=400, 
            details=details
        )

class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication failed", details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            message=message, 
            code="AUTHENTICATION_ERROR", 
            status_code=401, 
            details=details
        )

class AuthorizationError(AppException):
    def __init__(self, message: str = "Permission denied", details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            message=message, 
            code="AUTHORIZATION_ERROR", 
            status_code=403, 
            details=details
        )

class ConflictError(AppException):
    def __init__(self, message: str, details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            message=message, 
            code="CONFLICT_ERROR", 
            status_code=409, 
            details=details
        )
