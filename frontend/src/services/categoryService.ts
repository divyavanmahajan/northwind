import api from '@/lib/api';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/category';
import type { PaginatedResponse } from '@/types/api';

const BASE_URL = '/categories';

export interface CategoryListParams {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export const categoryService = {
    async getList(params: CategoryListParams = {}): Promise<PaginatedResponse<Category>> {
        const response = await api.get<PaginatedResponse<Category>>(BASE_URL, { params });
        return response.data;
    },

    async getById(id: number): Promise<Category> {
        const response = await api.get<Category>(`${BASE_URL}/${id}`);
        return response.data;
    },

    async create(data: CategoryCreate): Promise<Category> {
        const response = await api.post<Category>(BASE_URL, data);
        return response.data;
    },

    async update(id: number, data: CategoryUpdate): Promise<Category> {
        const response = await api.put<Category>(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`${BASE_URL}/${id}`);
    },
};
