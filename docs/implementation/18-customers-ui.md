# Prompt 18: Customers UI Components

## Context
Build Customers UI with statistics display and role-aware data access.

## Prerequisites
- Completed Prompt 17 (Customers CRUD Backend)

## Goals
1. Create customer list with order counts
2. Build customer detail with statistics
3. Implement role-aware UI (customers see own data only)
4. Add customer form with user linking option

---

## Prompt

```text
Implement Customers UI components with statistics and role-based access.

CUSTOMER TYPES AND SERVICE:
Follow established patterns from previous entities.

STATISTICS DISPLAY COMPONENT (src/components/features/customers/CustomerStats.tsx):
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerStatistics } from '@/types/customer';
import { DollarSign, ShoppingCart, Calendar, TrendingUp } from 'lucide-react';

interface CustomerStatsProps {
  statistics: CustomerStatistics;
}

export function CustomerStats({ statistics }: CustomerStatsProps) {
  const stats = [
    {
      title: 'Total Orders',
      value: statistics.total_orders,
      icon: ShoppingCart,
      format: (v: number) => v.toString(),
    },
    {
      title: 'Total Spent',
      value: statistics.total_spent,
      icon: DollarSign,
      format: formatCurrency,
    },
    {
      title: 'Average Order',
      value: statistics.average_order_value,
      icon: TrendingUp,
      format: formatCurrency,
    },
    {
      title: 'Last Order',
      value: statistics.last_order_date,
      icon: Calendar,
      format: (v: string | null) => v ? formatDate(v) : 'Never',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.format(stat.value as any)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

CUSTOMER DETAIL PAGE (src/pages/CustomerDetail.tsx):
```typescript
import { useParams } from 'react-router-dom';
import { useCustomer, useCustomerOrders } from '@/hooks/useCustomers';
import { CustomerStats } from '@/components/features/customers/CustomerStats';
import { DataTable } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useCustomer(id!);
  const { data: orders } = useCustomerOrders(id!, { page_size: 10 });

  if (isLoading) return <LoadingSpinner />;
  if (!customer) return <NotFound />;

  return (
    <div className="p-6 space-y-6">
      {/* Customer Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{customer.company_name}</h1>
          <p className="text-muted-foreground">
            {customer.contact_name} {customer.contact_title && `(${customer.contact_title})`}
          </p>
        </div>
        <RoleGate roles={['admin', 'manager']}>
          <Button onClick={() => navigate(`/customers/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </RoleGate>
      </div>

      {/* Statistics */}
      <CustomerStats statistics={customer.statistics} />

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Address</Label>
                <p>{customer.address}</p>
                <p>{customer.city}, {customer.region} {customer.postal_code}</p>
                <p>{customer.country}</p>
              </div>
              <div>
                <Label>Phone</Label>
                <p>{customer.phone || '-'}</p>
                <Label className="mt-4">Fax</Label>
                <p>{customer.fax || '-'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={orders?.data || []}
                columns={orderColumns}
                onRowClick={(order) => navigate(`/orders/${order.order_id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

CUSTOMERS LIST FOR CUSTOMER ROLE:
When logged in as customer, show simplified view of just their own profile with full detail.

CUSTOMER FORM:
Form with optional user account linking for admin:

```typescript
// For admins: Show user selection dropdown to link customer to user account
// This enables customer self-service login
<RoleGate roles={['admin']}>
  <div className="space-y-2">
    <Label>Link to User Account</Label>
    <Select
      value={selectedUserId}
      onValueChange={setSelectedUserId}
    >
      <SelectTrigger>
        <SelectValue placeholder="No user account" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">No user account</SelectItem>
        {availableUsers?.map((user) => (
          <SelectItem key={user.user_id} value={user.user_id}>
            {user.username} ({user.email})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <p className="text-sm text-muted-foreground">
      Linking allows this customer to log in and view their orders
    </p>
  </div>
</RoleGate>
```

ROUTING:
- /customers - list (admin/manager see all, customer sees self)
- /customers/:id - detail
- /customers/:id/edit - edit form

TESTS:
- Role-based data filtering
- Statistics display
- Order history display
- User linking (admin only)

SUCCESS CRITERIA:
- Customer list with role-based filtering
- Statistics cards display correctly
- Order history tab shows customer orders
- User linking works for admins
- Customer role sees only own profile
```

---

## Next Step
Proceed to [Prompt 19: Employees CRUD (Backend)](./19-employees-crud.md)
