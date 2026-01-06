import { useState } from 'react';
import { useSuppliers, useCountries, useCities, useDeleteSupplier } from '@/hooks/useSuppliers';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { FilterPanel } from '@/components/common/FilterPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/user';
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
} from "@/components/ui/alert-dialog";

export function Suppliers() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [sortBy, setSortBy] = useState('company_name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const { data: countries } = useCountries();
    const { data: cities } = useCities(country !== 'ALL' ? country : undefined);

    const { data, isLoading, isError } = useSuppliers({
        page,
        search,
        country: country !== 'ALL' ? country : undefined,
        city: city !== 'ALL' ? city : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
    });

    const deleteMutation = useDeleteSupplier();

    const handleCountryChange = (value: string) => {
        setCountry(value);
        setCity('ALL');
    };

    const handleClearFilters = () => {
        setCountry('ALL');
        setCity('ALL');
        setSearch('');
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Supplier deleted successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to delete supplier');
        }
    };

    const columns = [
        { key: 'company_name', label: 'Company Name', sortable: true },
        { key: 'contact_name', label: 'Contact', sortable: true },
        { key: 'city', label: 'City', sortable: true },
        { key: 'country', label: 'Country', sortable: true },
        { key: 'phone', label: 'Phone' },
        { key: 'product_count', label: 'Products', className: 'text-center' },
        {
            key: 'actions',
            label: 'Actions',
            render: (supplier: any) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/suppliers/${supplier.supplier_id}`)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    {isAdminOrManager && (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/suppliers/${supplier.supplier_id}/edit`)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will soft-delete the supplier. You cannot delete a supplier that has products.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(supplier.supplier_id)} className="bg-destructive text-destructive-foreground">
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

    const filters = [
        {
            key: 'country',
            label: 'Country',
            options: (countries || []).map(c => ({ value: c, label: c })),
            value: country,
            onChange: handleCountryChange,
        },
        {
            key: 'city',
            label: 'City',
            options: (cities || []).map(c => ({ value: c, label: c })),
            value: city,
            onChange: setCity,
        },
    ];

    if (isError) return <div>Error loading suppliers</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground">
                        Manage your product suppliers and their contact information.
                    </p>
                </div>
                {isAdminOrManager && (
                    <Button asChild>
                        <Link to="/suppliers/new">
                            <Plus className="mr-2 h-4 w-4" /> Add Supplier
                        </Link>
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search suppliers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <FilterPanel filters={filters} onClear={handleClearFilters} />
                </div>

                <DataTable
                    columns={columns}
                    data={data?.data || []}
                    isLoading={isLoading}
                    onSort={(key, order) => {
                        setSortBy(key);
                        setSortOrder(order);
                    }}
                    currentSort={{ key: sortBy, order: sortOrder }}
                />

                {data?.pagination && (
                    <Pagination
                        current={page}
                        total={data.pagination.total_pages}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    );
}
