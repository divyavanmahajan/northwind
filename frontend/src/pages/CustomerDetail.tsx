import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer, useCustomerOrders, useDeleteCustomer } from '@/hooks/useCustomers';
import { CustomerStats } from '@/components/features/customers/CustomerStats';
import { DataTable } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RoleGate } from '@/components/auth/RoleGate';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/common/Skeletons';
import { EmptyState } from '@/components/common/EmptyState';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function CustomerDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const customerId = id || 'me';

    const { data: customer, isLoading } = useCustomer(customerId);
    const { data: orders } = useCustomerOrders(customerId, { page_size: 10 });
    const deleteMutation = useDeleteCustomer();

    const handleDelete = async () => {
        const promise = deleteMutation.mutateAsync(customerId);
        toast.promise(promise, {
            loading: 'Deleting customer...',
            success: () => {
                navigate('/customers');
                return 'Customer deleted successfully';
            },
            error: (err) => {
                const apiError = err.response?.data?.detail || err.message;
                return `Failed to delete customer: ${apiError}`;
            },
        });
    };

    if (isLoading) return <PageLoading />;
    if (!customer) {
        return (
            <EmptyState
                title="Customer not found"
                description="The customer you are looking for does not exist or has been deleted."
                icon={AlertCircle}
                action={{ label: "Back to Customers", onClick: () => navigate('/customers') }}
            />
        );
    }

    const orderColumns = [
        { key: 'order_id', header: 'Order ID' },
        { key: 'order_date', header: 'Date' },
        { key: 'total', header: 'Total' },
        { key: 'status', header: 'Status' }
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
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`/customers/${customer.customer_id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will soft-delete the customer. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete Customer
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
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
