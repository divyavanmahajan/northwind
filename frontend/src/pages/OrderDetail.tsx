import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/features/orders/OrderStatusBadge';
import { OrderStatusSelect } from '@/components/features/orders/OrderStatusSelect';
import { RoleGate } from '@/components/auth/RoleGate';
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Printer, Pencil, ArrowLeft } from 'lucide-react';
import type { OrderStatus } from '@/types/order';

export function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: order, isLoading } = useOrder(parseInt(id!));
    const updateStatus = useUpdateOrderStatus();

    if (isLoading) return <div className="p-6">Loading...</div>;
    if (!order) return <div className="p-6">Order not found</div>;

    const handleStatusChange = async (newStatus: string) => {
        await updateStatus.mutateAsync({
            orderId: parseInt(id!),
            status: newStatus as OrderStatus,
        });
    };

    return (
        <div className="p-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate('/orders')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
            </Button>

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
                                <p className="font-medium">{order.employee.first_name} {order.employee.last_name}</p>
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

            {order.ship_name && (
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
            )}
        </div>
    );
}
