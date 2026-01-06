import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
    in_stock: { label: 'In Stock', className: 'bg-green-500 hover:bg-green-600' },
    low_stock: { label: 'Low Stock', className: 'bg-yellow-500 hover:bg-yellow-600' },
    out_of_stock: { label: 'Out of Stock', className: 'bg-red-500 hover:bg-red-600' },
    discontinued: { label: 'Discontinued', className: 'bg-gray-500 hover:bg-gray-600' },
};

interface StockStatusBadgeProps {
    status: string;
}

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.in_stock;

    return (
        <Badge className={cn(config.className, 'text-white')}>
            {config.label}
        </Badge>
    );
}
