import pytest
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.services.supplier_service import SupplierService
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.utils.exceptions import NotFoundError, ConflictError

def test_create_supplier(db_session: Session):
    service = SupplierService(db_session)
    data = SupplierCreate(
        company_name="Test Supplier",
        contact_name="John Doe",
        city="London",
        country="UK"
    )
    supplier = service.create(data)
    
    assert supplier.supplier_id is not None
    assert supplier.company_name == "Test Supplier"
    assert supplier.contact_name == "John Doe"

def test_get_supplier_by_id(db_session: Session):
    service = SupplierService(db_session)
    data = SupplierCreate(company_name="Test Supplier")
    created = service.create(data)
    
    supplier = service.get_by_id(created.supplier_id)
    assert supplier is not None
    assert supplier.supplier_id == created.supplier_id

def test_get_suppliers_list(db_session: Session):
    service = SupplierService(db_session)
    service.create(SupplierCreate(company_name="ABC Corp", country="USA"))
    service.create(SupplierCreate(company_name="XYZ Ltd", country="UK"))
    
    suppliers, total = service.get_list()
    assert total >= 2
    assert any(s.company_name == "ABC Corp" for s in suppliers)

def test_get_suppliers_filter_country(db_session: Session):
    service = SupplierService(db_session)
    service.create(SupplierCreate(company_name="Filter USA", country="USA"))
    service.create(SupplierCreate(company_name="Filter UK", country="UK"))
    
    suppliers, total = service.get_list(country="USA")
    # There might be other USA suppliers from other tests, so we check for at least 1
    # or we check that our specific supplier is in the list
    assert total >= 1
    assert any(s.company_name == "Filter USA" for s in suppliers)

def test_update_supplier(db_session: Session):
    service = SupplierService(db_session)
    created = service.create(SupplierCreate(company_name="Old Name"))
    
    updated = service.update(created.supplier_id, SupplierUpdate(company_name="New Name"))
    assert updated.company_name == "New Name"

def test_soft_delete_supplier(db_session: Session):
    service = SupplierService(db_session)
    created = service.create(SupplierCreate(company_name="To Delete"))
    
    service.delete(created.supplier_id)
    
    # Should not be found by get_by_id
    assert service.get_by_id(created.supplier_id) is None
    
    # Should still exist in DB with deleted_at set
    raw_supplier = db_session.query(Supplier).filter(Supplier.supplier_id == created.supplier_id).first()
    assert raw_supplier is not None
    assert raw_supplier.deleted_at is not None

def test_get_distinct_countries(db_session: Session):
    service = SupplierService(db_session)
    service.create(SupplierCreate(company_name="S1", country="USA"))
    service.create(SupplierCreate(company_name="S2", country="UK"))
    service.create(SupplierCreate(company_name="S3", country="USA"))
    
    countries = service.get_countries()
    assert "USA" in countries
    assert "UK" in countries
    assert len(countries) >= 2
