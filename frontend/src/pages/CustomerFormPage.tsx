import { useNavigate, useParams } from 'react-router-dom';
import { useCustomer, useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { CustomerForm } from '@/components/features/customers/CustomerForm';
import { CustomerFormData } from '@/types/customer';

export function CustomerFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // Only fetch if edit mode
    const { data: customerData, isLoading: isLoadingCustomer } = useCustomer(id || '');

    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();

    const handleSubmit = async (data: CustomerFormData) => {
        try {
            if (isEditMode && id) {
                await updateMutation.mutateAsync({ id, data });
                navigate(`/customers/${id}`);
            } else {
                const newCustomer = await createMutation.mutateAsync(data);
                navigate(`/customers/${newCustomer.customer_id}`);
            }
        } catch (error) {
            // Error handled in hook toast
        }
    };

    if (isEditMode && isLoadingCustomer) return <div>Loading...</div>;

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
