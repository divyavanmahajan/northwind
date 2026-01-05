# Prompt 22: Orders UI with Detail View

## Context
Build Orders UI with comprehensive detail view including line items and status management.

## Prerequisites
- Completed Prompt 21 (Orders CRUD Backend)

## Goals
1. Create orders list with status filtering
2. Build order detail with line items table
3. Implement order creation with product selection
4. Add status update workflow
5. Show order timeline

---

## Prompt

```text
Implement Orders UI with detail view and status management.

ORDER STATUS BADGE (src/components/features/orders/OrderStatusBadge.tsx):
```typescript
const statusConfig = {
  pending: { label: 'Pending', variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
  processing: { label: 'Processing', variant: 'outline', className: 'border-blue-500 text-blue-600' },
  shipped: { label: 'Shipped', variant: 'default', className: 'bg-purple-500' },
  delivered: { label: 'Delivered', variant: 'default', className: 'bg-green-500' },
  cancelled: { label: 'Cancelled', variant: 'destructive', className: '' },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig];
  return (
    <Badge className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
```

ORDER STATUS DROPDOWN (src/components/features/orders/OrderStatusSelect.tsx):
For updating status with valid transitions:

```typescript
interface OrderStatusSelectProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  isLoading?: boolean;
}

const transitions: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function OrderStatusSelect({
  currentStatus,
  onStatusChange,
  isLoading,
}: OrderStatusSelectProps) {
  const availableTransitions = transitions[currentStatus] || [];
  
  if (availableTransitions.length === 0) {
    return <OrderStatusBadge status={currentStatus} />;
  }
  
  return (
    <Select
      value={currentStatus}
      onValueChange={onStatusChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={currentStatus} disabled>
          {currentStatus}
        </SelectItem>
        {availableTransitions.map((status) => (
          <SelectItem key={status} value={status}>
            → {status.charAt(0).toUpperCase() + status.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

ORDER DETAIL PAGE (src/pages/OrderDetail.tsx):
```typescript
export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(parseInt(id!));
  const updateStatus = useUpdateOrderStatus();
  
  const handleStatusChange = async (newStatus: string) => {
    await updateStatus.mutateAsync({
      orderId: parseInt(id!),
      status: newStatus,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Order #{order.order_id}</h1>
            <RoleGate roles={['admin', 'manager']}>
              <OrderStatusSelect
                currentStatus={order.status}
                onStatusChange={handleStatusChange}
                isLoading={updateStatus.isPending}
              />
            </RoleGate>
            <RoleGate roles={['employee', 'customer']}>
              <OrderStatusBadge status={order.status} />
            </RoleGate>
          </div>
          <p className="text-muted-foreground">
            Placed on {formatDate(order.order_date)}
          </p>
        </div>
        <RoleGate roles={['admin', 'manager']}>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
            <Button variant="outline" onClick={() => navigate(`/orders/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </RoleGate>
      </div>
      
      {/* Order Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={`/customers/${order.customer.customer_id}`} className="hover:underline">
              <p className="font-medium">{order.customer.company_name}</p>
            </Link>
            <p className="text-sm text-muted-foreground">{order.customer.contact_name}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Employee</CardTitle>
          </CardHeader>
          <CardContent>
            {order.employee ? (
              <Link to={`/employees/${order.employee.employee_id}`} className="hover:underline">
                <p className="font-medium">{order.employee.full_name}</p>
              </Link>
            ) : (
              <p className="text-muted-foreground">Not assigned</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{order.shipper?.company_name || 'Not assigned'}</p>
            <p className="text-sm text-muted-foreground">
              {order.shipped_date ? `Shipped: ${formatDate(order.shipped_date)}` : 'Not shipped'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Order Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_details.map((item) => (
                <TableRow key={item.product_id}>
                  <TableCell>
                    <Link to={`/products/${item.product_id}`} className="hover:underline">
                      {item.product_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {item.discount > 0 ? `${(item.discount * 100).toFixed(0)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.final_total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Order Summary */}
          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_total > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Freight</span>
              <span>{formatCurrency(order.freight)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{order.ship_name}</p>
          <p>{order.ship_address}</p>
          <p>{order.ship_city}, {order.ship_region} {order.ship_postal_code}</p>
          <p>{order.ship_country}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

ORDER CREATION FORM:
Build multi-step or single page form with:
1. Customer selection (searchable dropdown)
2. Employee selection
3. Product line items with add/remove
4. Shipping information
5. Order summary before submit

```typescript
function OrderLineItems({ items, onUpdate }: { items: OrderDetailCreate[]; onUpdate: (items: OrderDetailCreate[]) => void }) {
  const { data: products } = useProductOptions();
  
  const addItem = () => {
    onUpdate([...items, { product_id: 0, quantity: 1, discount: 0 }]);
  };
  
  const removeItem = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };
  
  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };
  
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>Product</Label>
            <Select
              value={item.product_id.toString()}
              onValueChange={(v) => updateItem(index, 'product_id', parseInt(v))}
            >
              {/* Product options */}
            </Select>
          </div>
          <div className="w-24">
            <Label>Qty</Label>
            <Input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
            />
          </div>
          <div className="w-24">
            <Label>Discount %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={item.discount * 100}
              onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) / 100)}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}
```

ORDERS LIST PAGE:
With status tabs:

```typescript
export function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  return (
    <div className="p-6 space-y-6">
      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Orders table */}
    </div>
  );
}
```

VERIFICATION:
1. View orders list with status tabs
2. Filter by customer, employee, date range
3. View order detail with line items
4. Update order status (valid transitions only)
5. Create new order with line items
6. Customer role sees only own orders

SUCCESS CRITERIA:
- Orders list displays with status filtering
- Order detail shows all information
- Line items table with totals
- Status update workflow works
- Order creation with products works
- Customer data isolation works
```

---

## Phase 4 Complete!

Phase 4 (Business Entities) is now complete:
- Customers with statistics and data isolation
- Employees with org hierarchy
- Orders with line items and status workflow

---

## Next Step
Proceed to [Prompt 23: Data Seeding Scripts](./23-data-seeding.md)

This begins **Phase 5: Advanced Features & Dashboards**.
