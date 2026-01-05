from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.user import UserResponse
from app.auth.service import AuthService
from app.utils.exceptions import AuthenticationError
from app.auth.dependencies import get_current_user
from app.auth.permissions import get_permissions
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token.
    
    - **username**: Username or email
    - **password**: User password
    """
    auth_service = AuthService(db)
    
    try:
        user, tokens = auth_service.login(request.username, request.password)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return LoginResponse(
        access_token=tokens["access_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's information.
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse.model_validate(current_user)

@router.get("/me/permissions")
def get_my_permissions(current_user: User = Depends(get_current_user)):
    """
    Get current user's permissions.
    """
    permissions = get_permissions(current_user.role)
    return {
        "user_id": str(current_user.user_id),
        "username": current_user.username,
        "role": current_user.role.value,
        "permissions": [p.value for p in permissions]
    }

@router.post("/logout")
def logout():
    """
    Logout user (client-side token removal).
    
    Note: JWT tokens are stateless. Client should remove token.
    For true logout, implement token blacklisting.
    """
    return {"message": "Logged out successfully"}
