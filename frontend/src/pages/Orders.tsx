import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { OrderStatusBadge } from '@/components/features/orders/OrderStatusBadge';
import { useOrders, useDeleteOrder } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import type { OrderStatus, Order, OrderListResponse } from '@/types/order';

export function Orders() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const { data, isLoading } = useOrders({
        page,
        page_size: pageSize,
        status: statusFilter || undefined
    });
    const deleteOrder = useDeleteOrder();

    const canManage = user?.role === 'admin' || user?.role === 'manager';

    const columns = useMemo(() => [
        {
            key: 'order_id',
            header: 'Order #',
            sortable: true,
            className: 'w-[100px]'
        },
        {
            key: 'customer.company_name',
            header: 'Customer',
            sortable: true,
            render: (order: OrderListResponse) => (
                <span className="font-medium">{order.customer?.company_name || 'N/A'}</span>
            )
        },
        {
            key: 'order_date',
            header: 'Order Date',
            sortable: true,
            render: (order: OrderListResponse) => formatDate(order.order_date),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (order: OrderListResponse) => <OrderStatusBadge status={order.status} />,
        },
        {
            key: 'total',
            header: 'Total',
            sortable: true,
            className: 'text-right',
            render: (order: OrderListResponse) => (
                <span className="font-semibold">{formatCurrency(order.total)}</span>
            ),
        },
    ], []);

    const handleDelete = (orderId: number) => {
        if (confirm('Delete this order?')) {
            deleteOrder.mutate(orderId);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">
                        Manage customer orders and track their status.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => navigate('/orders/new')} className="shadow-lg shadow-primary/20">
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

            <div className="bg-card rounded-xl border shadow-sm">
                <DataTable
                    columns={columns}
                    data={data?.data || []}
                    isLoading={isLoading}
                    onRowClick={(order) => navigate(`/orders/${order.order_id}`)}
                    actions={canManage ? (order: OrderListResponse) => (
                        <div className="flex justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/orders/${order.order_id}`);
                                }}
                                className="h-8 w-8"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/orders/${order.order_id}/edit`);
                                }}
                                className="h-8 w-8 hover:text-primary"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(order.order_id);
                                }}
                                className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : undefined}
                />

                {data?.pagination && (
                    <div className="border-t px-4">
                        <Pagination
                            page={data.pagination.page}
                            pageSize={data.pagination.page_size}
                            totalItems={data.pagination.total_items}
                            totalPages={data.pagination.total_pages}
                            onPageChange={setPage}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
