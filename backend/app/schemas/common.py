from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(25, ge=1, le=100, description="Items per page")

class PaginationInfo(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: PaginationInfo

class MessageResponse(BaseModel):
    message: str

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str

class ErrorResponseData(BaseModel):
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None
    timestamp: datetime
    path: str

class ErrorResponse(BaseModel):
    error: ErrorResponseData
