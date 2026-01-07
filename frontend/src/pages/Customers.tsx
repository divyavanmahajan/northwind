import { useCallback } from 'react';
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/user';
import { EmptyState } from '@/components/common/EmptyState';
import { AlertCircle, Plus, Edit, Trash2, Eye } from 'lucide-react';
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
import type { CustomerFilters } from '@/types/customer';

export function Customers() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    // Redirect customer role to their own profile
    if (user?.role === UserRole.CUSTOMER) {
        return <Navigate to="/customers/me" replace />;
    }

    const [searchParams, setSearchParams] = useSearchParams();

    // Parse filters from URL
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'company_name';
    const sortOrder = (searchParams.get('sort_order') || 'asc') as 'asc' | 'desc';
    const country = searchParams.get('country') || undefined;
    const city = searchParams.get('city') || undefined;

    const filters: CustomerFilters = {
        search,
        country,
        city
    };

    const { data, isLoading, isError } = useCustomers({
        page,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters,
    });

    const deleteMutation = useDeleteCustomer();

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
            // Reset to page 1 when filters change (except page update itself)
            if (!updates.page) {
                newParams.set('page', '1');
            }
            setSearchParams(newParams);
        },
        [searchParams, setSearchParams]
    );

    const handleDelete = async (id: string) => {
        const promise = deleteMutation.mutateAsync(id);

        toast.promise(promise, {
            loading: 'Deleting customer...',
            success: 'Customer deleted successfully',
            error: (err) => {
                const apiError = err.response?.data?.detail || err.message;
                return `Failed to delete customer: ${apiError} `;
            },
        });
    };

    const columns = [
        { key: 'customer_id', header: 'ID', sortable: true },
        { key: 'company_name', header: 'Company', sortable: true },
        { key: 'contact_name', header: 'Contact', sortable: true },
        { key: 'country', header: 'Country', sortable: true },
        { key: 'city', header: 'City', sortable: true },
        { key: 'phone', header: 'Phone', sortable: false },
        { key: 'order_count', header: 'Orders', sortable: false },
        {
            key: 'actions',
            header: 'Actions',
            render: (customer: any) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/ customers / ${customer.customer_id} `)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {isAdminOrManager && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/ customers / ${customer.customer_id}/edit`)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button >
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
                                            This will soft-delete the customer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(customer.customer_id)}
                                            className="bg-destructive text-destructive-foreground"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div >
            ),
        },
    ];

    if (isError) {
        return (
            <EmptyState
                title="Error loading customers"
                description="We encountered an issue while fetching the customer list."
                icon={AlertCircle}
                action={{ label: "Retry", onClick: () => window.location.reload() }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">
                        Manage your customer database.
                    </p>
                </div>
                {isAdminOrManager && (
                    <Button asChild>
                        <Link to="/customers/new">
                            <Plus className="mr-2 h-4 w-4" /> Add Customer
                        </Link>
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search customers..."
                            value={search}
                            onChange={(e) => updateParams({ search: e.target.value })}
                            className="max-w-sm"
                        />
                    </div>
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
