import { describe, it, expect, beforeEach, vi } from 'vitest';
import { categoryService } from '../categoryService';
import type { CategoryCreate, CategoryUpdate } from '@/types/category';

// Mock the API instance (default export)
vi.mock('@/lib/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

import api from '@/lib/api';
const mockApi = vi.mocked(api);

describe('categoryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getList', () => {
        it('should fetch categories with default parameters', async () => {
            const mockResponse = {
                data: {
                    data: [
                        { category_id: 1, category_name: 'Beverages', description: 'Soft drinks', product_count: 5 },
                        { category_id: 2, category_name: 'Condiments', description: 'Sauces', product_count: 3 },
                    ],
                    pagination: {
                        page: 1,
                        page_size: 25,
                        total: 2,
                        total_pages: 1,
                    },
                },
            };

            mockApi.get.mockResolvedValueOnce(mockResponse);

            const result = await categoryService.getList();

            expect(mockApi.get).toHaveBeenCalledWith('/categories', {
                params: {},
            });
            expect(result).toEqual(mockResponse.data);
        });

        it('should fetch categories with custom parameters', async () => {
            const mockResponse = {
                data: {
                    data: [
                        { category_id: 1, category_name: 'Beverages', description: 'Soft drinks', product_count: 5 },
                    ],
                    pagination: {
                        page: 2,
                        page_size: 10,
                        total: 15,
                        total_pages: 2,
                    },
                },
            };

            mockApi.get.mockResolvedValueOnce(mockResponse);

            const result = await categoryService.getList({
                page: 2,
                page_size: 10,
                search: 'Bev',
                sort_by: 'category_name',
                sort_order: 'desc',
            });

            expect(mockApi.get).toHaveBeenCalledWith('/categories', {
                params: {
                    page: 2,
                    page_size: 10,
                    search: 'Bev',
                    sort_by: 'category_name',
                    sort_order: 'desc',
                },
            });
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle API errors', async () => {
            const error = {
                response: {
                    data: { detail: 'Internal server error' },
                    status: 500,
                },
            };

            mockApi.get.mockRejectedValueOnce(error);

            await expect(categoryService.getList()).rejects.toEqual(error);
        });
    });

    describe('getById', () => {
        it('should fetch a category by ID', async () => {
            const mockCategory = {
                category_id: 1,
                category_name: 'Beverages',
                description: 'Soft drinks',
                product_count: 5,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            mockApi.get.mockResolvedValueOnce({ data: mockCategory });

            const result = await categoryService.getById(1);

            expect(mockApi.get).toHaveBeenCalledWith('/categories/1');
            expect(result).toEqual(mockCategory);
        });

        it('should handle not found error', async () => {
            const error = {
                response: {
                    data: { detail: 'Category not found' },
                    status: 404,
                },
            };

            mockApi.get.mockRejectedValueOnce(error);

            await expect(categoryService.getById(999)).rejects.toEqual(error);
        });
    });

    describe('create', () => {
        it('should create a new category', async () => {
            const newCategory: CategoryCreate = {
                category_name: 'New Category',
                description: 'New description',
            };

            const mockResponse = {
                category_id: 3,
                ...newCategory,
                product_count: 0,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            mockApi.post.mockResolvedValueOnce({ data: mockResponse });

            const result = await categoryService.create(newCategory);

            expect(mockApi.post).toHaveBeenCalledWith('/categories', newCategory);
            expect(result).toEqual(mockResponse);
        });

        it('should handle validation errors', async () => {
            const newCategory: CategoryCreate = {
                category_name: '',
                description: 'Test',
            };

            const error = {
                response: {
                    data: {
                        detail: [
                            {
                                loc: ['body', 'category_name'],
                                msg: 'Category name is required',
                                type: 'value_error',
                            },
                        ],
                    },
                    status: 422,
                },
            };

            mockApi.post.mockRejectedValueOnce(error);

            await expect(categoryService.create(newCategory)).rejects.toEqual(error);
        });
    });

    describe('update', () => {
        it('should update an existing category', async () => {
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

            mockApi.put.mockResolvedValueOnce({ data: mockResponse });

            const result = await categoryService.update(1, updateData);

            expect(mockApi.put).toHaveBeenCalledWith('/categories/1', updateData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle conflict errors', async () => {
            const updateData: CategoryUpdate = {
                category_name: 'Existing Category',
            };

            const error = {
                response: {
                    data: { detail: 'Category name already exists' },
                    status: 409,
                },
            };

            mockApi.put.mockRejectedValueOnce(error);

            await expect(categoryService.update(1, updateData)).rejects.toEqual(error);
        });
    });

    describe('delete', () => {
        it('should delete a category', async () => {
            mockApi.delete.mockResolvedValueOnce({ data: { success: true } });

            await categoryService.delete(1);

            expect(mockApi.delete).toHaveBeenCalledWith('/categories/1');
        });

        it('should handle conflict when category has products', async () => {
            const error = {
                response: {
                    data: {
                        detail: 'Cannot delete category with 5 products. Reassign or delete products first.',
                    },
                    status: 409,
                },
            };

            mockApi.delete.mockRejectedValueOnce(error);

            await expect(categoryService.delete(1)).rejects.toEqual(error);
        });

        it('should handle not found error', async () => {
            const error = {
                response: {
                    data: { detail: 'Category not found' },
                    status: 404,
                },
            };

            mockApi.delete.mockRejectedValueOnce(error);

            await expect(categoryService.delete(999)).rejects.toEqual(error);
        });
    });
});
