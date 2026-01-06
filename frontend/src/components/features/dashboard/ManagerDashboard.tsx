import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/common/StatCard';
import { LineChart } from '@/components/common/charts/LineChart';
import { PieChart } from '@/components/common/charts/PieChart';
import { ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ManagerDashboardData } from '@/types/dashboard';

interface ManagerDashboardProps {
    data: ManagerDashboardData;
}

export function ManagerDashboard({ data }: ManagerDashboardProps) {
    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(num);
    };

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Orders"
                    value={data.sales_overview.total_orders}
                    icon={ShoppingCart}
                    trend={{
                        value: data.sales_overview.orders_change_percent,
                        isPositive: data.sales_overview.orders_change_percent > 0
                    }}
                />
                <StatCard
                    title="Revenue"
                    value={formatCurrency(data.sales_overview.total_revenue)}
                    icon={DollarSign}
                    trend={{
                        value: data.sales_overview.revenue_change_percent,
                        isPositive: data.sales_overview.revenue_change_percent > 0
                    }}
                />
                <StatCard
                    title="Avg Order Value"
                    value={formatCurrency(data.sales_overview.average_order_value)}
                    icon={TrendingUp}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <LineChart
                            labels={data.revenue_trend.map(r => r.period)}
                            datasets={[{
                                label: 'Revenue',
                                data: data.revenue_trend.map(r => Number(r.revenue))
                            }]}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Orders by Status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <div className="w-64 h-64">
                            <PieChart
                                labels={data.orders_by_status.map(s => s.status)}
                                data={data.orders_by_status.map(s => s.count)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Qty Sold</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.top_products.map((product) => (
                                    <TableRow key={product.product_id}>
                                        <TableCell className="font-medium">{product.product_name}</TableCell>
                                        <TableCell className="text-right">{product.quantity_sold}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Low Stock Alerts</CardTitle>
                        <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {data.low_stock_alerts.length}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">In Stock</TableHead>
                                    <TableHead className="text-right">Reorder</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.low_stock_alerts.map((product) => (
                                    <TableRow key={product.product_id}>
                                        <TableCell className="font-medium">{product.product_name}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={product.units_in_stock === 0 ? 'destructive' : 'secondary'}>
                                                {product.units_in_stock}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{product.reorder_level}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
