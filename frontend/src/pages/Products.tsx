import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { ProductFilterPanel } from '@/components/features/products/ProductFilterPanel';
import { StockStatusBadge } from '@/components/features/products/StockStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/user';
import { formatCurrency } from '@/lib/utils';
import type { ProductFilters } from '@/types/product';
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

export function Products() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    const [searchParams, setSearchParams] = useSearchParams();

    // Parse filters from URL
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'product_name';
    const sortOrder = (searchParams.get('sort_order') || 'asc') as 'asc' | 'desc';

    const filters: ProductFilters = {
        category_id: searchParams.get('category_id')
            ? parseInt(searchParams.get('category_id')!)
            : undefined,
        supplier_id: searchParams.get('supplier_id')
            ? parseInt(searchParams.get('supplier_id')!)
            : undefined,
        stock_status: searchParams.get('stock_status') || undefined,
        price_min: searchParams.get('price_min')
            ? parseFloat(searchParams.get('price_min')!)
            : undefined,
        price_max: searchParams.get('price_max')
            ? parseFloat(searchParams.get('price_max')!)
            : undefined,
        discontinued: searchParams.get('discontinued') === 'true' ? true : undefined,
    };

    const { data, isLoading, isError } = useProducts({
        page,
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters,
    });

    const deleteMutation = useDeleteProduct();

    // Update URL when filters change
    const updateParams = useCallback(
        (updates: Record<string, any>) => {
            const newParams = new URLSearchParams(searchParams);
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    newParams.set(key, String(value));
                } else {
                    newParams.delete(key);
                }
            });
            // Reset to page 1 when filters change
            if (!updates.page) {
                newParams.set('page', '1');
            }
            setSearchParams(newParams);
        },
        [searchParams, setSearchParams]
    );

    const handleFiltersChange = (newFilters: ProductFilters) => {
        updateParams({
            category_id: newFilters.category_id,
            supplier_id: newFilters.supplier_id,
            stock_status: newFilters.stock_status,
            price_min: newFilters.price_min,
            price_max: newFilters.price_max,
            discontinued: newFilters.discontinued,
        });
    };

    const handleClearFilters = () => {
        setSearchParams(new URLSearchParams({ page: '1' }));
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Product deleted successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to delete product');
        }
    };

    const columns = [
        { key: 'product_id', header: 'ID', sortable: true },
        { key: 'product_name', header: 'Product', sortable: true },
        { key: 'category_name', header: 'Category', sortable: true },
        { key: 'supplier_name', header: 'Supplier', sortable: true },
        {
            key: 'unit_price',
            header: 'Price',
            sortable: true,
            render: (product: any) => formatCurrency(product.unit_price),
        },
        { key: 'units_in_stock', header: 'Stock', sortable: true },
        {
            key: 'stock_status',
            header: 'Status',
            render: (product: any) => <StockStatusBadge status={product.stock_status} />,
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (product: any) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/products/${product.product_id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {isAdminOrManager && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/products/${product.product_id}/edit`)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will soft-delete the product. You cannot delete a product that is
                                            referenced in orders.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(product.product_id)}
                                            className="bg-destructive text-destructive-foreground"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            ),
        },
    ];

    if (isError) return <div>Error loading products</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">
                        Manage your product catalog with comprehensive filtering and search.
                    </p>
                </div>
                {isAdminOrManager && (
                    <Button asChild>
                        <Link to="/products/new">
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Link>
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => updateParams({ search: e.target.value })}
                            className="max-w-sm"
                        />
                    </div>
                    <ProductFilterPanel
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onClear={handleClearFilters}
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={data?.data || []}
                    isLoading={isLoading}
                    onSort={(key, order) => {
                        updateParams({ sort_by: key, sort_order: order });
                    }}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                />

                {data?.pagination && (
                    <Pagination
                        page={data.pagination.page}
                        pageSize={data.pagination.page_size}
                        totalItems={data.pagination.total_items}
                        totalPages={data.pagination.total_pages}
                        onPageChange={(newPage) => updateParams({ page: newPage })}
                        onPageSizeChange={(newSize) => updateParams({ page_size: newSize, page: 1 })}
                    />
                )}
            </div>
        </div>
    );
}
