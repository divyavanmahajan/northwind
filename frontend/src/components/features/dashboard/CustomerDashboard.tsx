import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/common/StatCard';
import { OrderStatusBadge } from '@/components/features/orders/OrderStatusBadge';
import { ShoppingCart, DollarSign, TrendingUp, Package } from 'lucide-react';
import type { CustomerDashboardData } from '@/types/dashboard';
import { Link } from 'react-router-dom';

interface CustomerDashboardProps {
    data: CustomerDashboardData;
}

export function CustomerDashboard({ data }: CustomerDashboardProps) {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Orders"
                    value={data.my_orders_count}
                    icon={ShoppingCart}
                    description="All time"
                />
                <StatCard
                    title="Total Spent"
                    value={formatCurrency(data.my_total_spent)}
                    icon={DollarSign}
                    description="All time"
                />
                <StatCard
                    title="Avg Order Value"
                    value={formatCurrency(data.my_average_order)}
                    icon={TrendingUp}
                />
            </div>

            {/* Recent Orders and Favorite Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.my_recent_orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No orders yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.my_recent_orders.map((order) => (
                                        <TableRow key={order.order_id}>
                                            <TableCell>
                                                <Link
                                                    to={`/orders/${order.order_id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    #{order.order_id}
                                                </Link>
                                            </TableCell>
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

                {/* Favorite Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Favorite Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Times Ordered</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.my_favorite_products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                                            No orders yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.my_favorite_products.map((product, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{product.product_name}</TableCell>
                                            <TableCell className="text-right">{product.times_ordered}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
