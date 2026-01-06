import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderStatusBadge } from './OrderStatusBadge';
import type { OrderStatus } from '@/types/order';

interface OrderStatusSelectProps {
    currentStatus: OrderStatus;
    onStatusChange: (status: OrderStatus) => void;
    isLoading?: boolean;
}

const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
};

export function OrderStatusSelect({ currentStatus, onStatusChange, isLoading }: OrderStatusSelectProps) {
    const availableTransitions = transitions[currentStatus] || [];

    if (availableTransitions.length === 0) {
        return <OrderStatusBadge status={currentStatus} />;
    }

    return (
        <Select value={currentStatus} onValueChange={onStatusChange} disabled={isLoading}>
            <SelectTrigger className="w-[140px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={currentStatus} disabled>
                    {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </SelectItem>
                {availableTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                        → {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
