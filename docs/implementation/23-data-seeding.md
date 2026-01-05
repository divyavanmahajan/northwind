# Prompt 23: Data Seeding Scripts

## Context
Beginning Phase 5: Advanced Features. Before building dashboards, we need to seed the database with Northwind data.

## Prerequisites
- All entity models created (Prompts 11-22)
- Migration for all tables complete

## Goals
1. Create seed data files from Northwind
2. Build seed script with proper order
3. Create sample users for each role
4. Link users to customers/employees
5. Verify data integrity

---

## Prompt

```text
Create comprehensive data seeding scripts for the Northwind database.

DATA FILES (backend/data/):
Create or obtain CSV files for standard Northwind data:
- categories.csv (8 rows)
- suppliers.csv (29 rows)
- products.csv (77 rows)
- customers.csv (91 rows)
- employees.csv (9 rows)
- shippers.csv (3 rows)
- orders.csv (830 rows)
- order_details.csv (2155 rows)

SEED SCRIPT (backend/scripts/seed_database.py):
```python
#!/usr/bin/env python
\"\"\"
Seed the Northwind database with sample data.

Usage:
    python scripts/seed_database.py          # Normal seed (skip if data exists)
    python scripts/seed_database.py --force  # Force re-seed (clears data first)
    python scripts/seed_database.py --users-only  # Create sample users only
\"\"\"
import argparse
import csv
import os
from pathlib import Path
from datetime import datetime
from decimal import Decimal

from app.database import SessionLocal, engine, Base
from app.models import *
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole

DATA_DIR = Path(__file__).parent.parent / "data"


def load_csv(filename: str) -> list[dict]:
    \"\"\"Load data from CSV file.\"\"\"
    filepath = DATA_DIR / filename
    if not filepath.exists():
        print(f"Warning: {filename} not found")
        return []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)


def seed_categories(db):
    \"\"\"Seed categories table.\"\"\"
    if db.query(Category).count() > 0:
        print("Categories already seeded, skipping...")
        return
    
    data = load_csv("categories.csv")
    for row in data:
        category = Category(
            category_id=int(row['category_id']),
            category_name=row['category_name'],
            description=row.get('description', '')
        )
        db.add(category)
    
    db.commit()
    print(f"Seeded {len(data)} categories")


def seed_suppliers(db):
    \"\"\"Seed suppliers table.\"\"\"
    if db.query(Supplier).count() > 0:
        print("Suppliers already seeded, skipping...")
        return
    
    data = load_csv("suppliers.csv")
    for row in data:
        supplier = Supplier(
            supplier_id=int(row['supplier_id']),
            company_name=row['company_name'],
            contact_name=row.get('contact_name'),
            contact_title=row.get('contact_title'),
            address=row.get('address'),
            city=row.get('city'),
            region=row.get('region'),
            postal_code=row.get('postal_code'),
            country=row.get('country'),
            phone=row.get('phone'),
            fax=row.get('fax'),
            homepage=row.get('homepage')
        )
        db.add(supplier)
    
    db.commit()
    print(f"Seeded {len(data)} suppliers")


def seed_products(db):
    \"\"\"Seed products table.\"\"\"
    if db.query(Product).count() > 0:
        print("Products already seeded, skipping...")
        return
    
    data = load_csv("products.csv")
    for row in data:
        product = Product(
            product_id=int(row['product_id']),
            product_name=row['product_name'],
            supplier_id=int(row['supplier_id']) if row.get('supplier_id') else None,
            category_id=int(row['category_id']) if row.get('category_id') else None,
            quantity_per_unit=row.get('quantity_per_unit'),
            unit_price=Decimal(row['unit_price']) if row.get('unit_price') else None,
            units_in_stock=int(row['units_in_stock']) if row.get('units_in_stock') else 0,
            units_on_order=int(row['units_on_order']) if row.get('units_on_order') else 0,
            reorder_level=int(row['reorder_level']) if row.get('reorder_level') else 0,
            discontinued=row.get('discontinued', '0') == '1'
        )
        db.add(product)
    
    db.commit()
    print(f"Seeded {len(data)} products")


def seed_customers(db):
    \"\"\"Seed customers table.\"\"\"
    if db.query(Customer).count() > 0:
        print("Customers already seeded, skipping...")
        return
    
    data = load_csv("customers.csv")
    for row in data:
        customer = Customer(
            customer_id=row['customer_id'],
            company_name=row['company_name'],
            contact_name=row.get('contact_name'),
            contact_title=row.get('contact_title'),
            address=row.get('address'),
            city=row.get('city'),
            region=row.get('region'),
            postal_code=row.get('postal_code'),
            country=row.get('country'),
            phone=row.get('phone'),
            fax=row.get('fax')
        )
        db.add(customer)
    
    db.commit()
    print(f"Seeded {len(data)} customers")


def seed_employees(db):
    \"\"\"Seed employees table.\"\"\"
    if db.query(Employee).count() > 0:
        print("Employees already seeded, skipping...")
        return
    
    data = load_csv("employees.csv")
    for row in data:
        employee = Employee(
            employee_id=int(row['employee_id']),
            last_name=row['last_name'],
            first_name=row['first_name'],
            title=row.get('title'),
            title_of_courtesy=row.get('title_of_courtesy'),
            birth_date=parse_date(row.get('birth_date')),
            hire_date=parse_date(row.get('hire_date')),
            address=row.get('address'),
            city=row.get('city'),
            region=row.get('region'),
            postal_code=row.get('postal_code'),
            country=row.get('country'),
            home_phone=row.get('home_phone'),
            extension=row.get('extension'),
            notes=row.get('notes'),
            reports_to=int(row['reports_to']) if row.get('reports_to') else None
        )
        db.add(employee)
    
    db.commit()
    print(f"Seeded {len(data)} employees")


def seed_shippers(db):
    \"\"\"Seed shippers table.\"\"\"
    if db.query(Shipper).count() > 0:
        print("Shippers already seeded, skipping...")
        return
    
    data = load_csv("shippers.csv")
    for row in data:
        shipper = Shipper(
            shipper_id=int(row['shipper_id']),
            company_name=row['company_name'],
            phone=row.get('phone')
        )
        db.add(shipper)
    
    db.commit()
    print(f"Seeded {len(data)} shippers")


def seed_orders(db):
    \"\"\"Seed orders table.\"\"\"
    if db.query(Order).count() > 0:
        print("Orders already seeded, skipping...")
        return
    
    data = load_csv("orders.csv")
    for row in data:
        order = Order(
            order_id=int(row['order_id']),
            customer_id=row.get('customer_id'),
            employee_id=int(row['employee_id']) if row.get('employee_id') else None,
            order_date=parse_date(row.get('order_date')),
            required_date=parse_date(row.get('required_date')),
            shipped_date=parse_date(row.get('shipped_date')),
            ship_via=int(row['ship_via']) if row.get('ship_via') else None,
            freight=Decimal(row['freight']) if row.get('freight') else Decimal(0),
            ship_name=row.get('ship_name'),
            ship_address=row.get('ship_address'),
            ship_city=row.get('ship_city'),
            ship_region=row.get('ship_region'),
            ship_postal_code=row.get('ship_postal_code'),
            ship_country=row.get('ship_country'),
            status='delivered'  # Historical orders are delivered
        )
        db.add(order)
    
    db.commit()
    print(f"Seeded {len(data)} orders")


def seed_order_details(db):
    \"\"\"Seed order_details table.\"\"\"
    if db.query(OrderDetail).count() > 0:
        print("Order details already seeded, skipping...")
        return
    
    data = load_csv("order_details.csv")
    for row in data:
        detail = OrderDetail(
            order_id=int(row['order_id']),
            product_id=int(row['product_id']),
            unit_price=Decimal(row['unit_price']),
            quantity=int(row['quantity']),
            discount=Decimal(row['discount'])
        )
        db.add(detail)
    
    db.commit()
    print(f"Seeded {len(data)} order details")


def seed_users(db):
    \"\"\"Create sample users for each role.\"\"\"
    service = UserService(db)
    
    users_to_create = [
        {"username": "admin", "email": "admin@northwind.com", "password": "Admin123!", "role": UserRole.ADMIN},
        {"username": "manager", "email": "manager@northwind.com", "password": "Manager123!", "role": UserRole.MANAGER},
        {"username": "employee", "email": "employee@northwind.com", "password": "Employee123!", "role": UserRole.EMPLOYEE},
    ]
    
    # Create customer users linked to first 5 customers
    customers = db.query(Customer).limit(5).all()
    for i, customer in enumerate(customers, 1):
        users_to_create.append({
            "username": f"customer{i}",
            "email": f"customer{i}@example.com",
            "password": "Customer123!",
            "role": UserRole.CUSTOMER,
            "link_customer": customer.customer_id
        })
    
    for user_data in users_to_create:
        link_customer = user_data.pop("link_customer", None)
        
        # Check if user exists
        if service.get_by_username(user_data["username"]):
            print(f"User {user_data['username']} already exists, skipping...")
            continue
        
        user = service.create(UserCreate(**user_data))
        print(f"Created user: {user.username} ({user.role.value})")
        
        # Link to customer if specified
        if link_customer:
            customer = db.query(Customer).filter(Customer.customer_id == link_customer).first()
            if customer:
                customer.user_id = user.user_id
                db.commit()
                print(f"  -> Linked to customer {link_customer}")
    
    # Link employee user to first employee
    employee_user = service.get_by_username("employee")
    if employee_user:
        first_employee = db.query(Employee).first()
        if first_employee and not first_employee.user_id:
            first_employee.user_id = employee_user.user_id
            db.commit()
            print(f"Linked employee user to {first_employee.full_name}")


def parse_date(date_str):
    \"\"\"Parse date string from CSV.\"\"\"
    if not date_str:
        return None
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y'):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None


def clear_all_data(db):
    \"\"\"Clear all data from tables in correct order.\"\"\"
    print("Clearing all data...")
    db.query(OrderDetail).delete()
    db.query(Order).delete()
    db.query(Product).delete()
    db.query(Customer).delete()
    db.query(Employee).delete()
    db.query(Shipper).delete()
    db.query(Supplier).delete()
    db.query(Category).delete()
    db.query(User).delete()
    db.commit()
    print("All data cleared")


def verify_data(db):
    \"\"\"Verify seeded data.\"\"\"
    print("\n=== Data Verification ===")
    print(f"Categories: {db.query(Category).count()}")
    print(f"Suppliers: {db.query(Supplier).count()}")
    print(f"Products: {db.query(Product).count()}")
    print(f"Customers: {db.query(Customer).count()}")
    print(f"Employees: {db.query(Employee).count()}")
    print(f"Shippers: {db.query(Shipper).count()}")
    print(f"Orders: {db.query(Order).count()}")
    print(f"Order Details: {db.query(OrderDetail).count()}")
    print(f"Users: {db.query(User).count()}")


def main():
    parser = argparse.ArgumentParser(description='Seed Northwind database')
    parser.add_argument('--force', action='store_true', help='Force re-seed')
    parser.add_argument('--users-only', action='store_true', help='Seed users only')
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        if args.force:
            clear_all_data(db)
        
        if not args.users_only:
            # Seed in order of dependencies
            seed_categories(db)
            seed_suppliers(db)
            seed_shippers(db)
            seed_products(db)
            seed_customers(db)
            seed_employees(db)
            seed_orders(db)
            seed_order_details(db)
        
        seed_users(db)
        verify_data(db)
        
        print("\n✅ Database seeding complete!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
```

VERIFICATION:
1. Obtain Northwind CSV files (from public sources)
2. Run: docker-compose exec backend python scripts/seed_database.py
3. Verify counts match expected
4. Test login with each sample user
5. Verify customer users see only their orders

SUCCESS CRITERIA:
- All Northwind data seeded
- Sample users created for each role
- Customer users linked to customers
- Employee user linked to employee
- Data integrity verified
```

---

## Next Step
Proceed to [Prompt 24: Dashboard API Endpoints](./24-dashboard-api.md)
