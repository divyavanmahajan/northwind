import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { ProductForm } from '@/components/features/products/ProductForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageLoading } from '@/components/common/Skeletons';
import type { ProductCreateInput } from '@/types/product';

export function ProductFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;

    const productId = parseInt(id || '0');
    const { data: product, isLoading: isLoadingProduct } = useProduct(productId);
    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();

    const handleSubmit = async (data: ProductCreateInput) => {
        const promise = isEdit
            ? updateMutation.mutateAsync({ id: productId, data })
            : createMutation.mutateAsync(data);

        toast.promise(promise, {
            loading: isEdit ? 'Updating product...' : 'Creating product...',
            success: (res) => {
                navigate('/products');
                return `Product "${res.product_name}" ${isEdit ? 'updated' : 'created'} successfully`;
            },
            error: (err) => {
                const apiError = err.response?.data?.detail || err.message;
                return `Failed to ${isEdit ? 'update' : 'create'} product: ${apiError}`;
            },
        });
    };

    const handleCancel = () => {
        navigate('/products');
    };

    if (isEdit && isLoadingProduct) {
        return <PageLoading />;
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate('/products')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>{isEdit ? 'Edit Product' : 'Create New Product'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductForm
                        product={product}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
