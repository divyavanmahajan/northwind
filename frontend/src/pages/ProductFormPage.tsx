import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { ProductForm } from '@/components/features/products/ProductForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ id: productId, data });
            } else {
                await createMutation.mutateAsync(data);
            }
            navigate('/products');
        } catch (error) {
            // Error handling is done in the mutation hooks
        }
    };

    const handleCancel = () => {
        navigate('/products');
    };

    if (isEdit && isLoadingProduct) {
        return <div>Loading...</div>;
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
