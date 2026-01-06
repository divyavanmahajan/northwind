from sqlalchemy import text
from app.database import SessionLocal

def check_counts():
    db = SessionLocal()
    try:
        req = db.execute(text("SELECT COUNT(*) FROM categories"))
        count = req.scalar()
        print(f"Categories: {count}")
        
        req = db.execute(text("SELECT COUNT(*) FROM products"))
        count = req.scalar()
        print(f"Products: {count}")
        
        req = db.execute(text("SELECT COUNT(*) FROM orders"))
        count = req.scalar()
        print(f"Orders: {count}")
    finally:
        db.close()

if __name__ == "__main__":
    check_counts()
