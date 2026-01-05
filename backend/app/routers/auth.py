from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.user import UserResponse
from app.auth.service import AuthService
from app.utils.exceptions import AuthenticationError

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

@router.post("/logout")
def logout():
    """
    Logout user (client-side token removal).
    
    Note: JWT tokens are stateless. Client should remove token.
    For true logout, implement token blacklisting.
    """
    return {"message": "Logged out successfully"}
