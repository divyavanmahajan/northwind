import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService, type CategoryListParams } from '@/services/categoryService';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';
import type { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

export const categoryKeys = {
    all: ['categories'] as const,
    lists: () => [...categoryKeys.all, 'list'] as const,
    list: (params: CategoryListParams) => [...categoryKeys.lists(), params] as const,
    details: () => [...categoryKeys.all, 'detail'] as const,
    detail: (id: number) => [...categoryKeys.details(), id] as const,
};



export function useCategories(params: CategoryListParams = {}) {
    return useQuery<PaginatedResponse<Category>>({
        queryKey: categoryKeys.list(params),
        queryFn: () => categoryService.getList(params),
    });
}

export function useCategory(id: number) {
    return useQuery({
        queryKey: categoryKeys.detail(id),
        queryFn: () => categoryService.getById(id),
        enabled: !!id,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CategoryCreate) => categoryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            toast.success('Category created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to create category');
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CategoryUpdate }) =>
            categoryService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
            toast.success('Category updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to update category');
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => categoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            toast.success('Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to delete category');
        },
    });
}
