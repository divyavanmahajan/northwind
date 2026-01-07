import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { CustomerStatistics } from '@/types/customer';
import { DollarSign, ShoppingCart, Calendar, TrendingUp } from 'lucide-react';

interface CustomerStatsProps {
    statistics?: CustomerStatistics;
}

export function CustomerStats({ statistics }: CustomerStatsProps) {
    if (!statistics) {
        return null;
    }

    const stats: Array<{
        title: string;
        value: any;
        icon: any;
        format: (v: any) => string;
    }> = [
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
