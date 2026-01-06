import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/order';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'border-yellow-500 text-yellow-600 bg-yellow-50' },
    processing: { label: 'Processing', className: 'border-blue-500 text-blue-600 bg-blue-50' },
    shipped: { label: 'Shipped', className: 'border-purple-500 text-purple-600 bg-purple-50' },
    delivered: { label: 'Delivered', className: 'border-green-500 text-green-600 bg-green-50' },
    cancelled: { label: 'Cancelled', className: 'border-red-500 text-red-600 bg-red-50' },
};

interface OrderStatusBadgeProps {
    status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const config = statusConfig[status];
    return (
        <Badge variant="outline" className={cn(config.className)}>
            {config.label}
        </Badge>
    );
}
