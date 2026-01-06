from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.shipper import ShipperResponse, ShipperCreate, ShipperUpdate
from app.services.shipper_service import ShipperService

router = APIRouter(prefix="/shippers", tags=["Shippers"])

@router.get("", response_model=List[ShipperResponse])
def list_shippers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ShipperService(db)
    return service.get_all()

@router.get("/{shipper_id}", response_model=ShipperResponse)
def get_shipper(
    shipper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ShipperService(db)
    shipper = service.get_by_id(shipper_id)
    if not shipper:
        raise HTTPException(status_code=404, detail="Shipper not found")
    return shipper

@router.post("", response_model=ShipperResponse, status_code=status.HTTP_201_CREATED)
def create_shipper(
    data: ShipperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    service = ShipperService(db)
    return service.create(data)

@router.put("/{shipper_id}", response_model=ShipperResponse)
def update_shipper(
    shipper_id: int,
    data: ShipperUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    service = ShipperService(db)
    shipper = service.update(shipper_id, data)
    if not shipper:
        raise HTTPException(status_code=404, detail="Shipper not found")
    return shipper

@router.delete("/{shipper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipper(
    shipper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    service = ShipperService(db)
    if not service.delete(shipper_id):
        raise HTTPException(status_code=404, detail="Shipper not found")
