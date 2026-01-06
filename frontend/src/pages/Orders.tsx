import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { OrderStatusBadge } from '@/components/features/orders/OrderStatusBadge';
import { useOrders, useDeleteOrder } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import type { OrderStatus } from '@/types/order';
import type { ColumnDef } from '@tanstack/react-table';

export function Orders() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const { data, isLoading } = useOrders({ page, page_size: 25, status: statusFilter || undefined });
    const deleteOrder = useDeleteOrder();

    const canManage = user?.role === 'admin' || user?.role === 'manager';

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'order_id',
            header: 'Order #',
        },
        {
            accessorKey: 'customer.company_name',
            header: 'Customer',
        },
        {
            accessorKey: 'order_date',
            header: 'Order Date',
            cell: ({ row }) => formatDate(row.original.order_date),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'total',
            header: 'Total',
            cell: ({ row }) => formatCurrency(row.original.total),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/orders/${row.original.order_id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {canManage && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/orders/${row.original.order_id}/edit`)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (confirm('Delete this order?')) {
                                        deleteOrder.mutate(row.original.order_id);
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Orders</h1>
                {canManage && (
                    <Button onClick={() => navigate('/orders/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                    </Button>
                )}
            </div>

            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | '')}>
                <TabsList>
                    <TabsTrigger value="">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="processing">Processing</TabsTrigger>
                    <TabsTrigger value="shipped">Shipped</TabsTrigger>
                    <TabsTrigger value="delivered">Delivered</TabsTrigger>
                </TabsList>
            </Tabs>

            <DataTable
                columns={columns}
                data={data?.data || []}
                isLoading={isLoading}
                pagination={{
                    page,
                    pageSize: 25,
                    totalPages: data?.pagination.total_pages || 1,
                    onPageChange: setPage,
                }}
            />
        </div>
    );
}
