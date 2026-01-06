from pydantic import BaseModel, ConfigDict
from typing import Optional

class ShipperBase(BaseModel):
    company_name: str
    phone: Optional[str] = None

class ShipperCreate(ShipperBase):
    pass

class ShipperUpdate(BaseModel):
    company_name: Optional[str] = None
    phone: Optional[str] = None

class ShipperResponse(ShipperBase):
    shipper_id: int
    model_config = ConfigDict(from_attributes=True)

class ShipperInfo(BaseModel):
    shipper_id: int
    company_name: str
    phone: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
