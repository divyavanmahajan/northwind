from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.shipper import Shipper
from app.schemas.shipper import ShipperCreate, ShipperUpdate

class ShipperService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(self) -> List[Shipper]:
        return self.db.query(Shipper).order_by(Shipper.company_name).all()
    
    def get_by_id(self, shipper_id: int) -> Optional[Shipper]:
        return self.db.query(Shipper).filter(Shipper.shipper_id == shipper_id).first()
    
    def create(self, data: ShipperCreate) -> Shipper:
        shipper = Shipper(**data.model_dump())
        self.db.add(shipper)
        self.db.commit()
        self.db.refresh(shipper)
        return shipper
        
    def update(self, shipper_id: int, data: ShipperUpdate) -> Optional[Shipper]:
        shipper = self.get_by_id(shipper_id)
        if not shipper:
            return None
            
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(shipper, key, value)
            
        self.db.commit()
        self.db.refresh(shipper)
        return shipper

    def delete(self, shipper_id: int) -> bool:
        shipper = self.get_by_id(shipper_id)
        if not shipper:
            return False
        self.db.delete(shipper)
        self.db.commit()
        return True
