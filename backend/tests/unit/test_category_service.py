import pytest
from app.services.category_service import CategoryService
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.utils.exceptions import NotFoundError, ConflictError

class TestCategoryService:
    def test_create_category(self, db_session):
        suffix = "1767683404"
        service = CategoryService(db_session)
        data = CategoryCreate(
            category_name=f"Test Category {suffix}",
            description="Test Description"
        )
        category = service.create(data)
        
        assert category.category_id is not None
        assert category.category_name == f"Test Category {suffix}"
        assert category.description == "Test Description"
    
    def test_create_duplicate_name(self, db_session):
        suffix = "1767683404"
        service = CategoryService(db_session)
        data = CategoryCreate(category_name=f"Duplicate {suffix}")
        service.create(data)
        
        with pytest.raises(ConflictError):
            service.create(data)
    
    def test_get_by_id(self, db_session):
        suffix = "1767683404"
        service = CategoryService(db_session)
        created = service.create(CategoryCreate(category_name=f"Find Me {suffix}"))
        found = service.get_by_id(created.category_id)
        
        assert found is not None
        assert found.category_id == created.category_id
    
    def test_get_by_id_not_found(self, db_session):
        service = CategoryService(db_session)
        found = service.get_by_id(99999)
        assert found is None
    
    def test_update_category(self, db_session):
        suffix = "1767683404"
        service = CategoryService(db_session)
        created = service.create(CategoryCreate(category_name=f"Original {suffix}"))
        
        updated = service.update(
            created.category_id,
            CategoryUpdate(category_name=f"Updated {suffix}")
        )
        
        assert updated.category_name == f"Updated {suffix}"
    
    def test_update_not_found(self, db_session):
        service = CategoryService(db_session)
        
        with pytest.raises(NotFoundError):
            service.update(99999, CategoryUpdate(category_name="New"))
    
    def test_delete_category(self, db_session):
        suffix = "1767683404"
        service = CategoryService(db_session)
        created = service.create(CategoryCreate(category_name=f"Delete Me {suffix}"))
        
        result = service.delete(created.category_id)
        assert result is True
        assert service.get_by_id(created.category_id) is None
    
    def test_list_with_pagination(self, db_session):
        suffix = "1767683404"
        service = CategoryService(db_session)
        
        # Create multiple categories
        for i in range(10):
            service.create(CategoryCreate(category_name=f"Pag {i} {suffix}"))
        
        # Get first page
        categories, total = service.get_list(page=1, page_size=5)
        assert len(categories) == 5
        assert total >= 10
        
        # Get second page
        categories, total = service.get_list(page=2, page_size=5)
        assert len(categories) == 5
    
    def test_list_with_search(self, db_session):
        suffix = "1767683404"
        service = CategoryService(db_session)
        service.create(CategoryCreate(category_name=f"Beverages {suffix}"))
        service.create(CategoryCreate(category_name=f"Seafood {suffix}"))
        
        categories, total = service.get_list(search=suffix)
        assert total >= 2
        assert any(c.category_name == f"Beverages {suffix}" for c in categories)
