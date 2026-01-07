
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
    useCategories,
    useCategory,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
} from '../useCategories';
import { categoryService } from '@/services/categoryService';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';

// Mock the category service
vi.mock('@/services/categoryService');

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useCategories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch categories successfully', async () => {
        const mockData = {
            data: [
                { category_id: 1, category_name: 'Beverages', description: 'Soft drinks', product_count: 5, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
                { category_id: 2, category_name: 'Condiments', description: 'Sauces', product_count: 3, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
            ],
            pagination: {
                page: 1,
                page_size: 25,
                total_items: 2,
                total_pages: 1,
                has_next: false,
                has_previous: false,
            },
        };

        vi.mocked(categoryService.getList).mockResolvedValue(mockData);

        const { result } = renderHook(() => useCategories(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockData);
        expect(categoryService.getList).toHaveBeenCalledWith({});
    });

    it('should fetch categories with custom parameters', async () => {
        const mockData = {
            data: [
                { category_id: 1, category_name: 'Beverages', description: 'Soft drinks', product_count: 5, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
            ],
            pagination: {
                page: 2,
                page_size: 10,
                total_items: 15,
                total_pages: 2,
                has_next: false,
                has_previous: true,
            },
        };

        vi.mocked(categoryService.getList).mockResolvedValue(mockData);

        const { result } = renderHook(
            () =>
                useCategories({
                    page: 2,
                    page_size: 10,
                    search: 'Bev',
                    sort_by: 'category_name',
                    sort_order: 'desc',
                }),
            {
                wrapper: createWrapper(),
            }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(categoryService.getList).toHaveBeenCalledWith({
            page: 2,
            page_size: 10,
            search: 'Bev',
            sort_by: 'category_name',
            sort_order: 'desc',
        });
    });

    it('should handle errors', async () => {
        const error = new Error('Failed to fetch categories');
        vi.mocked(categoryService.getList).mockRejectedValue(error);

        const { result } = renderHook(() => useCategories(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toEqual(error);
    });
});

describe('useCategory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch a category by ID', async () => {
        const mockCategory = {
            category_id: 1,
            category_name: 'Beverages',
            description: 'Soft drinks',
            product_count: 5,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
        };

        vi.mocked(categoryService.getById).mockResolvedValue(mockCategory);

        const { result } = renderHook(() => useCategory(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockCategory);
        expect(categoryService.getById).toHaveBeenCalledWith(1);
    });

    it('should not fetch when ID is undefined', () => {
        const { result } = renderHook(() => useCategory(undefined), {
            wrapper: createWrapper(),
        });

        expect(result.current.data).toBeUndefined();
        expect(categoryService.getById).not.toHaveBeenCalled();
    });
});

describe('useCreateCategory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a category successfully', async () => {
        const newCategory: CategoryCreate = {
            category_name: 'New Category',
            description: 'New description',
        };

        const mockResponse: Category = {
            category_id: 3,
            category_name: newCategory.category_name,
            description: newCategory.description ?? null,
            product_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
        };

        vi.mocked(categoryService.create).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useCreateCategory(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(newCategory);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockResponse);
        expect(categoryService.create).toHaveBeenCalledWith(newCategory);
    });

    it('should handle creation errors', async () => {
        const newCategory: CategoryCreate = {
            category_name: 'Existing Category',
            description: 'Test',
        };

        const error = new Error('Category name already exists');
        vi.mocked(categoryService.create).mockRejectedValue(error);

        const { result } = renderHook(() => useCreateCategory(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(newCategory);

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toEqual(error);
    });
});

describe('useUpdateCategory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update a category successfully', async () => {
        const updateData: CategoryUpdate = {
            category_name: 'Updated Category',
            description: 'Updated description',
        };

        const mockResponse = {
            category_id: 1,
            category_name: 'Updated Category',
            description: 'Updated description',
            product_count: 5,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
        };

        vi.mocked(categoryService.update).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUpdateCategory(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ id: 1, data: updateData });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockResponse);
        expect(categoryService.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should handle update errors', async () => {
        const updateData: CategoryUpdate = {
            category_name: 'Existing Category',
        };

        const error = new Error('Category name already exists');
        vi.mocked(categoryService.update).mockRejectedValue(error);

        const { result } = renderHook(() => useUpdateCategory(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ id: 1, data: updateData });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toEqual(error);
    });
});

describe('useDeleteCategory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should delete a category successfully', async () => {
        vi.mocked(categoryService.delete).mockResolvedValue(undefined);

        const { result } = renderHook(() => useDeleteCategory(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(categoryService.delete).toHaveBeenCalledWith(1);
    });

    it('should handle deletion errors', async () => {
        const error = new Error(
            'Cannot delete category with 5 products. Reassign or delete products first.'
        );
        vi.mocked(categoryService.delete).mockRejectedValue(error);

        const { result } = renderHook(() => useDeleteCategory(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toEqual(error);
    });
});
