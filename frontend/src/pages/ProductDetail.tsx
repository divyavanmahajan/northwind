import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/user';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StockStatusBadge } from '@/components/features/products/StockStatusBadge';
import { OrderStatusBadge } from '@/components/features/orders/OrderStatusBadge';
import { PageLoading } from '@/components/common/Skeletons';
import { EmptyState } from '@/components/common/EmptyState';
import { AlertCircle, ArrowLeft, Edit, Trash2, Package, DollarSign, TrendingUp } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    const productId = parseInt(id || '0');
    const { data: product, isLoading, isError } = useProduct(productId);
    const { data: orders, isLoading: isLoadingOrders } = useOrders({
        product_id: productId,
        page_size: 5,
        sort_by: 'order_date',
        sort_order: 'desc'
    });
    const deleteMutation = useDeleteProduct();

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(productId);
            toast.success('Product deleted successfully');
            navigate('/products');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to delete product');
        }
    };

    const handleDiscontinue = async () => {
        // This would be a separate mutation in a real app
        toast.info('Discontinue functionality will be implemented');
    };

    if (isLoading) return <PageLoading />;

    if (isError || !product) {
        return (
            <EmptyState
                title="Product not found"
                description="The product you are looking for might have been deleted or does not exist."
                icon={AlertCircle}
                action={{ label: "Back to Products", onClick: () => navigate('/products') }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate('/products')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
                </Button>
                {isAdminOrManager && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`/products/${id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        {!product.discontinued && (
                            <Button variant="outline" onClick={handleDiscontinue}>
                                Discontinue
                            </Button>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will soft-delete the product. This action cannot be undone if the product
                                        is referenced in orders.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Product Info */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">{product.product_name}</CardTitle>
                                <p className="text-muted-foreground mt-1">ID: {product.product_id}</p>
                            </div>
                            <div className="flex gap-2">
                                <StockStatusBadge status={product.stock_status} />
                                {product.discontinued && (
                                    <Badge variant="secondary" className="bg-gray-500 text-white">
                                        Discontinued
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                                {product.category ? (
                                    <Link
                                        to={`/categories`}
                                        className="text-primary hover:underline"
                                    >
                                        {product.category.category_name}
                                    </Link>
                                ) : (
                                    <p className="text-muted-foreground">N/A</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Supplier</h4>
                                {product.supplier ? (
                                    <Link
                                        to={`/suppliers/${product.supplier.supplier_id}`}
                                        className="text-primary hover:underline"
                                    >
                                        {product.supplier.company_name}
                                    </Link>
                                ) : (
                                    <p className="text-muted-foreground">N/A</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Quantity Per Unit</h4>
                                <p>{product.quantity_per_unit || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Unit Price</h4>
                                <p className="text-lg font-semibold">{formatCurrency(product.unit_price)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    Units In Stock
                                </h4>
                                <p className="text-lg font-semibold">{product.units_in_stock ?? 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    Units On Order
                                </h4>
                                <p className="text-lg font-semibold">{product.units_on_order ?? 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    Reorder Level
                                </h4>
                                <p className="text-lg font-semibold">{product.reorder_level ?? 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Supplier Contact Card */}
                {product.supplier && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Supplier Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Company</h4>
                                <Link
                                    to={`/suppliers/${product.supplier.supplier_id}`}
                                    className="text-primary hover:underline"
                                >
                                    {product.supplier.company_name}
                                </Link>
                            </div>
                            {product.supplier.contact_name && (
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
                                    <p>{product.supplier.contact_name}</p>
                                </div>
                            )}
                            <Button variant="outline" className="w-full" asChild>
                                <Link to={`/suppliers/${product.supplier.supplier_id}`}>
                                    View Supplier Details
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Orders */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={[
                                {
                                    key: 'order_id',
                                    header: 'Order #',
                                    className: 'w-[100px]'
                                },
                                {
                                    key: 'customer.company_name',
                                    header: 'Customer',
                                    render: (order: any) => (
                                        <Link to={`/customers/${order.customer?.customer_id}`} className="hover:underline font-medium">
                                            {order.customer?.company_name || 'N/A'}
                                        </Link>
                                    )
                                },
                                {
                                    key: 'order_date',
                                    header: 'Order Date',
                                    render: (order: any) => formatDate(order.order_date),
                                },
                                {
                                    key: 'status',
                                    header: 'Status',
                                    render: (order: any) => <OrderStatusBadge status={order.status} />,
                                },
                                {
                                    key: 'total',
                                    header: 'Total',
                                    className: 'text-right',
                                    render: (order: any) => (
                                        <span className="font-semibold">{formatCurrency(order.total)}</span>
                                    ),
                                },
                            ]}
                            data={orders?.data || []}
                            isLoading={isLoadingOrders}
                            onRowClick={(order) => navigate(`/orders/${order.order_id}`)}
                            emptyMessage="No recent orders found for this product."
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
