import { useNavigate, useParams } from 'react-router-dom';
import { useCustomer, useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { CustomerForm } from '@/components/features/customers/CustomerForm';
import { toast } from 'sonner';
import { PageLoading } from '@/components/common/Skeletons';
import type { CustomerFormData } from '@/types/customer';

export function CustomerFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // Only fetch if edit mode
    const { data: customerData, isLoading: isLoadingCustomer } = useCustomer(id || '');

    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();

    const handleSubmit = async (data: CustomerFormData) => {
        const promise = isEditMode && id
            ? updateMutation.mutateAsync({ id, data })
            : createMutation.mutateAsync(data);

        toast.promise(promise, {
            loading: isEditMode ? 'Updating customer...' : 'Creating customer...',
            success: (res) => {
                navigate(`/customers/${res.customer_id}`);
                return `Customer "${res.company_name}" ${isEditMode ? 'updated' : 'created'} successfully`;
            },
            error: (err) => {
                const apiError = err.response?.data?.detail || err.message;
                return `Failed to ${isEditMode ? 'update' : 'create'} customer: ${apiError}`;
            },
        });
    };

    if (isEditMode && isLoadingCustomer) return <PageLoading />;
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isEditMode ? 'Edit Customer' : 'Create Customer'}
                </h1>
                <p className="text-muted-foreground">
                    {isEditMode ? 'Update customer details.' : 'Add a new customer to the database.'}
                </p>
            </div>

            <CustomerForm
                customer={customerData}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/customers')}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
