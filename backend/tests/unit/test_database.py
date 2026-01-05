from sqlalchemy import text

def test_database_connection(db):
    """Verify database connection works by executing a simple query."""
    result = db.execute(text("SELECT 1"))
    assert result.scalar() == 1

def test_session_creation(db):
    """Verify session is active."""
    assert db.is_active is True

def test_northwind_tables_exist(db):
    """Verify that Northwind tables (like customer) were seeded."""
    result = db.execute(text("SELECT count(*) FROM customer"))
    assert result.scalar() > 0
