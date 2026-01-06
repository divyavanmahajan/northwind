import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { supplierService } from '@/services/supplierService';
import type { ProductListParams, ProductCreateInput, ProductUpdateInput } from '@/types/product';
import { toast } from 'sonner';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: number) => [...productKeys.details(), id] as const,
};

export function useProducts(params: ProductListParams = {}) {
    return useQuery({
        queryKey: productKeys.list(params),
        queryFn: () => productService.getList(params),
    });
}

export function useProduct(id: number) {
    return useQuery({
        queryKey: productKeys.detail(id),
        queryFn: () => productService.getById(id),
        enabled: !!id,
    });
}

// Hook for category dropdown options
export function useCategoryOptions() {
    return useQuery({
        queryKey: ['categories', 'options'],
        queryFn: async () => {
            const response = await categoryService.getList({ page_size: 100 });
            return response.data.map((c) => ({
                value: c.category_id,
                label: c.category_name,
            }));
        },
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    });
}

// Hook for supplier dropdown options
export function useSupplierOptions() {
    return useQuery({
        queryKey: ['suppliers', 'options'],
        queryFn: async () => {
            const response = await supplierService.getList({ page_size: 100 });
            return response.data.map((s) => ({
                value: s.supplier_id,
                label: s.company_name,
            }));
        },
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ProductCreateInput) => productService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            toast.success('Product created successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to create product'
            );
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ProductUpdateInput }) =>
            productService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
            toast.success('Product updated successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to update product'
            );
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => productService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            toast.success('Product deleted successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to delete product'
            );
        },
    });
}
