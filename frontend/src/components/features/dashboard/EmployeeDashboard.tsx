import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/common/StatCard';
import { OrderStatusBadge } from '@/components/features/orders/OrderStatusBadge';
import { ShoppingCart, DollarSign } from 'lucide-react';
import type { EmployeeDashboardData } from '@/types/dashboard';
import { Link } from 'react-router-dom';

interface EmployeeDashboardProps {
    data: EmployeeDashboardData;
}

export function EmployeeDashboard({ data }: EmployeeDashboardProps) {
    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(num);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                    title="My Orders"
                    value={data.my_orders_count}
                    icon={ShoppingCart}
                    description="Orders assigned to me"
                />
                <StatCard
                    title="My Orders Revenue"
                    value={formatCurrency(data.my_orders_revenue)}
                    icon={DollarSign}
                    description="Total value of my orders"
                />
            </div>

            {/* Recent Orders */}
            <Card>
                <CardHeader>
                    <CardTitle>My Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.recent_orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No orders assigned yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.recent_orders.map((order) => (
                                    <TableRow key={order.order_id}>
                                        <TableCell>
                                            <Link
                                                to={`/orders/${order.order_id}`}
                                                className="font-medium hover:underline"
                                            >
                                                #{order.order_id}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{order.customer_name}</TableCell>
                                        <TableCell>{formatDate(order.order_date)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                        <TableCell>
                                            <OrderStatusBadge status={order.status} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
