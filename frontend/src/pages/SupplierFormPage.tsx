import { useParams, useNavigate } from 'react-router-dom';
import { useSupplier, useCreateSupplier, useUpdateSupplier } from '@/hooks/useSuppliers';
import { SupplierForm } from '@/components/features/suppliers/SupplierForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoading } from '@/components/common/Skeletons';

export function SupplierFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;
    const supplierId = isEdit ? parseInt(id) : 0;

    const { data: supplier, isLoading: isFetchLoading } = useSupplier(supplierId);
    const createMutation = useCreateSupplier();
    const updateMutation = useUpdateSupplier(supplierId);

    const handleSubmit = async (data: any) => {
        const promise = isEdit
            ? updateMutation.mutateAsync(data)
            : createMutation.mutateAsync(data);

        toast.promise(promise, {
            loading: isEdit ? 'Updating supplier...' : 'Creating supplier...',
            success: (res) => {
                navigate('/suppliers');
                return `Supplier "${res.company_name}" ${isEdit ? 'updated' : 'created'} successfully`;
            },
            error: (err) => {
                const apiError = err.response?.data?.detail || err.message;
                return `Failed to ${isEdit ? 'update' : 'create'} supplier: ${apiError}`;
            },
        });
    };

    if (isEdit && isFetchLoading) return <PageLoading />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isEdit ? 'Edit Supplier' : 'New Supplier'}
                </h1>
            </div>

            <SupplierForm
                initialData={supplier}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
