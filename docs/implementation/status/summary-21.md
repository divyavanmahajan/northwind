# Step 21 Summary: Orders CRUD (Backend)

## Completed Tasks
- **Models**:
  - Created `Shipper` model (app/models/shipper.py).
  - Created `Order` model (app/models/order.py) with relationships to Customer, Employee, Shipper.
  - Created `OrderDetail` model (app/models/order_detail.py) with line item calculation logic.
  - Updated `Customer`, `Employee`, `Product` models to include reverse relationships (`back_populates`).
- **Schemas**:
  - Created `Shipper` schemas (app/schemas/shipper.py).
  - Created `Order` and `OrderDetail` schemas (app/schemas/order.py), including nested `CustomerInfo`, `EmployeeInfo` (newly added).
- **Services**:
  - Implemented `ShipperService` with CRUD.
  - Implemented `OrderService` with:
    - Order creation with transactional line items.
    - Status workflow enforcement (Pending -> Processing -> Shipped/Cancelled).
    - Totals calculation (subtotal, discount, freight).
    - Access control filtering (Customers see only own orders).
- **Routers**:
  - Implemented `ShippersRouter`.
  - Implemented `OrdersRouter` with pagination, filtering, and status updates.
- **Database**:
  - Ran migration `create_shippers_orders_details_tables`.
- **Tests**:
  - Added integration tests for Order creation, Status workflow, and Deletion.
  - Fixed fixture usage (`test_customer`, `test_product`, `test_employee`).

## Notes
- Encountered and fixed import issues in `main.py` and `routers/employees.py`.
- Encountered and fixed relationship mapping errors ("mapper failed to initialize") by updating all related models.
- Verified 400 Bad Request for invalid status transitions.
