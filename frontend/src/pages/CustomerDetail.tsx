import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer, useCustomerOrders } from '@/hooks/useCustomers';
import { CustomerStats } from '@/components/features/customers/CustomerStats';
import { DataTable } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RoleGate } from '@/components/auth/RoleGate';
import { Pencil } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function CustomerDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const customerId = id || 'me';

    const { data: customer, isLoading } = useCustomer(customerId);
    const { data: orders } = useCustomerOrders(customerId, { page_size: 10 });

    if (isLoading) return <div>Loading...</div>;
    if (!customer) return <div>Customer not found</div>;

    const orderColumns = [
        { key: 'order_id', label: 'Order ID' },
        { key: 'order_date', label: 'Date' },
        { key: 'total_amount', label: 'Total' },
        { key: 'status', label: 'Status' }
    ];

    return (
        <div className="space-y-6">
            {/* Customer Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{customer.company_name}</h1>
                    <p className="text-muted-foreground">
                        {customer.contact_name} {customer.contact_title && `(${customer.contact_title})`}
                    </p>
                </div>
                <RoleGate roles={['admin', 'manager']}>
                    <Button onClick={() => navigate(`/customers/${customer.customer_id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </RoleGate>
            </div>

            {/* Statistics */}
            {customer.statistics && <CustomerStats statistics={customer.statistics} />}

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
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-muted-foreground">Address</Label>
                                <div className="mt-1">
                                    <p>{customer.address}</p>
                                    <p>{[customer.city, customer.region, customer.postal_code].filter(Boolean).join(', ')}</p>
                                    <p>{customer.country}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Contact</Label>
                                <div className="mt-1 space-y-2">
                                    <div>
                                        <span className="font-medium mr-2">Phone:</span>
                                        {customer.phone || '-'}
                                    </div>
                                    <div>
                                        <span className="font-medium mr-2">Fax:</span>
                                        {customer.fax || '-'}
                                    </div>
                                </div>
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
                            {(!orders?.data || orders.data.length === 0) && (
                                <p className="text-center text-muted-foreground py-4">No orders found.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
