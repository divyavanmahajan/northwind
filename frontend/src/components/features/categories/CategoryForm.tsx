import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Category, CategoryCreate } from '@/types/category';

const categorySchema = z.object({
    category_name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: z.string().optional().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    category?: Category;
    onSubmit: (data: CategoryCreate) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function CategoryForm({
    category,
    onSubmit,
    onCancel,
    isLoading,
}: CategoryFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            category_name: category?.category_name || '',
            description: category?.description || '',
        },
    });

    const handleFormSubmit = (data: CategoryFormData) => {
        onSubmit({
            category_name: data.category_name,
            description: data.description || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="category_name">Category Name <span className="text-destructive">*</span></Label>
                <Input
                    id="category_name"
                    {...register('category_name')}
                    placeholder="e.g. Beverages"
                    disabled={isLoading}
                    className={errors.category_name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.category_name && (
                    <p className="text-xs font-medium text-destructive">{errors.category_name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Brief description of the category"
                    rows={4}
                    disabled={isLoading}
                />
                {errors.description && (
                    <p className="text-xs font-medium text-destructive">{errors.description.message}</p>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="min-w-[100px]">
                    {isLoading ? (
                        <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Saving...
                        </>
                    ) : category ? (
                        'Update Category'
                    ) : (
                        'Create Category'
                    )}
                </Button>
            </div>
        </form>
    );
}
