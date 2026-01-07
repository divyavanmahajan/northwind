import { useParams, useNavigate } from 'react-router-dom';
import { useSupplier, useDeleteSupplier, useSupplierProducts } from '@/hooks/useSuppliers';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, ArrowLeft, Globe, Phone, MapPin, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
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

export function SupplierDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    const supplierId = parseInt(id || '0');
    const { data: supplier, isLoading, isError } = useSupplier(supplierId);
    const { data: products, isLoading: isLoadingProducts } = useSupplierProducts(supplierId);
    const deleteMutation = useDeleteSupplier();

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(supplierId);
            toast.success('Supplier deleted successfully');
            navigate('/suppliers');
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to delete supplier');
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading supplier details...</div>;
    if (isError || !supplier) {
        return (
            <div className="p-8 text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <h3 className="text-lg font-medium">Supplier not found</h3>
                <Button onClick={() => navigate('/suppliers')}>Back to Suppliers</Button>
            </div>
        );
    }

    const productColumns = [
        {
            key: 'product_id',
            header: 'ID',
            className: 'w-[80px]'
        },
        {
            key: 'product_name',
            header: 'Product Name',
            render: (product: any) => (
                <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate(`/products/${product.product_id}`)}>
                    {product.product_name}
                </span>
            )
        },
        {
            key: 'category_name',
            header: 'Category',
            render: (product: any) => product.category?.category_name || 'N/A'
        },
        {
            key: 'unit_price',
            header: 'Unit Price',
            render: (product: any) => formatCurrency(product.unit_price)
        },
        {
            key: 'units_in_stock',
            header: 'Stock',
            className: 'w-[100px]'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate('/suppliers')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Suppliers
                </Button>
                {isAdminOrManager && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`/suppliers/${id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
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
                                        This will soft-delete the supplier. This action cannot be undone if they have associated records.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-2xl">{supplier.company_name}</CardTitle>
                        <p className="text-muted-foreground">{supplier.contact_title}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Contact Name</h4>
                                <p>{supplier.contact_name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">Products</h4>
                                <p>{supplier.product_count} products supplied</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                                <div>
                                    <p>{supplier.address}</p>
                                    <p>{supplier.city}, {supplier.region} {supplier.postal_code}</p>
                                    <p>{supplier.country}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{supplier.phone || 'N/A'}</span>
                        </div>
                        {supplier.fax && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>Fax: {supplier.fax}</span>
                            </div>
                        )}
                        {supplier.homepage && (
                            <div className="flex items-center gap-2 text-primary">
                                <Globe className="h-4 w-4" />
                                <a href={supplier.homepage} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                                    {supplier.homepage.replace(/^https?:\/\//, '')}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Products List Placeholder */}
                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Products from this Supplier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={productColumns}
                            data={products || []}
                            isLoading={isLoadingProducts}
                            onRowClick={(product) => navigate(`/products/${product.product_id}`)}
                            emptyMessage="This supplier has no products listed."
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
