import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCategoryOptions, useSupplierOptions } from '@/hooks/useProducts';
import type { Product, ProductCreateInput } from '@/types/product';

const productSchema = z.object({
    product_name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
    category_id: z.number().optional().nullable(),
    supplier_id: z.number().optional().nullable(),
    quantity_per_unit: z.string().max(100, 'Quantity per unit too long').optional().nullable(),
    unit_price: z.number().min(0, 'Price must be positive').optional().nullable(),
    units_in_stock: z.number().int().min(0, 'Stock must be non-negative').optional().nullable(),
    units_on_order: z.number().int().min(0, 'Units on order must be non-negative').optional().nullable(),
    reorder_level: z.number().int().min(0, 'Reorder level must be non-negative').optional().nullable(),
    discontinued: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
    product?: Product;
    onSubmit: (data: ProductCreateInput) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ProductForm({
    product,
    onSubmit,
    onCancel,
    isLoading,
}: ProductFormProps) {
    const { data: categories } = useCategoryOptions();
    const { data: suppliers } = useSupplierOptions();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            product_name: product?.product_name || '',
            category_id: product?.category_id || null,
            supplier_id: product?.supplier_id || null,
            quantity_per_unit: product?.quantity_per_unit || '',
            unit_price: product?.unit_price || null,
            units_in_stock: product?.units_in_stock || null,
            units_on_order: product?.units_on_order || null,
            reorder_level: product?.reorder_level || null,
            discontinued: product?.discontinued || false,
        },
    });

    const handleFormSubmit = (data: ProductFormData) => {
        onSubmit({
            product_name: data.product_name,
            category_id: data.category_id || null,
            supplier_id: data.supplier_id || null,
            quantity_per_unit: data.quantity_per_unit || null,
            unit_price: data.unit_price || null,
            units_in_stock: data.units_in_stock || null,
            units_on_order: data.units_on_order || null,
            reorder_level: data.reorder_level || null,
            discontinued: data.discontinued || false,
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="product_name">
                        Product Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="product_name"
                        {...register('product_name')}
                        placeholder="e.g. Chai"
                        disabled={isLoading}
                        className={errors.product_name ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.product_name && (
                        <p className="text-xs font-medium text-destructive">{errors.product_name.message}</p>
                    )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <Label htmlFor="category_id">Category</Label>
                    <Controller
                        name="category_id"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value?.toString() || 'NULL'}
                                onValueChange={(v) => field.onChange(v === 'NULL' ? null : parseInt(v))}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="category_id">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NULL">None</SelectItem>
                                    {categories?.map((c) => (
                                        <SelectItem key={c.value} value={c.value.toString()}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier</Label>
                    <Controller
                        name="supplier_id"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value?.toString() || 'NULL'}
                                onValueChange={(v) => field.onChange(v === 'NULL' ? null : parseInt(v))}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="supplier_id">
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NULL">None</SelectItem>
                                    {suppliers?.map((s) => (
                                        <SelectItem key={s.value} value={s.value.toString()}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Quantity Per Unit */}
                <div className="space-y-2">
                    <Label htmlFor="quantity_per_unit">Quantity Per Unit</Label>
                    <Input
                        id="quantity_per_unit"
                        {...register('quantity_per_unit')}
                        placeholder="e.g. 10 boxes x 20 bags"
                        disabled={isLoading}
                    />
                </div>

                {/* Unit Price */}
                <div className="space-y-2">
                    <Label htmlFor="unit_price">Unit Price</Label>
                    <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        {...register('unit_price', { valueAsNumber: true })}
                        placeholder="0.00"
                        disabled={isLoading}
                        className={errors.unit_price ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.unit_price && (
                        <p className="text-xs font-medium text-destructive">{errors.unit_price.message}</p>
                    )}
                </div>

                {/* Units In Stock */}
                <div className="space-y-2">
                    <Label htmlFor="units_in_stock">Units In Stock</Label>
                    <Input
                        id="units_in_stock"
                        type="number"
                        {...register('units_in_stock', { valueAsNumber: true })}
                        placeholder="0"
                        disabled={isLoading}
                        className={errors.units_in_stock ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.units_in_stock && (
                        <p className="text-xs font-medium text-destructive">{errors.units_in_stock.message}</p>
                    )}
                </div>

                {/* Units On Order */}
                <div className="space-y-2">
                    <Label htmlFor="units_on_order">Units On Order</Label>
                    <Input
                        id="units_on_order"
                        type="number"
                        {...register('units_on_order', { valueAsNumber: true })}
                        placeholder="0"
                        disabled={isLoading}
                        className={errors.units_on_order ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.units_on_order && (
                        <p className="text-xs font-medium text-destructive">{errors.units_on_order.message}</p>
                    )}
                </div>

                {/* Reorder Level */}
                <div className="space-y-2">
                    <Label htmlFor="reorder_level">Reorder Level</Label>
                    <Input
                        id="reorder_level"
                        type="number"
                        {...register('reorder_level', { valueAsNumber: true })}
                        placeholder="0"
                        disabled={isLoading}
                        className={errors.reorder_level ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.reorder_level && (
                        <p className="text-xs font-medium text-destructive">{errors.reorder_level.message}</p>
                    )}
                </div>

                {/* Discontinued */}
                <div className="flex items-center space-x-2 md:col-span-2">
                    <Controller
                        name="discontinued"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                id="discontinued"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isLoading}
                            />
                        )}
                    />
                    <Label htmlFor="discontinued">Discontinued</Label>
                </div>
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
                    ) : product ? (
                        'Update Product'
                    ) : (
                        'Create Product'
                    )}
                </Button>
            </div>
        </form>
    );
}
