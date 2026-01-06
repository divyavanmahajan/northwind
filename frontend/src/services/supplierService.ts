import api from '@/lib/api';
import type { Supplier, SupplierCreate, SupplierUpdate } from '@/types/supplier';
import type { PaginatedResponse } from '@/types/api';

const BASE_URL = '/suppliers';

export interface SupplierListParams {
    page?: number;
    page_size?: number;
    search?: string;
    country?: string;
    city?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export const supplierService = {
    async getList(params: SupplierListParams = {}): Promise<PaginatedResponse<Supplier>> {
        const response = await api.get<PaginatedResponse<Supplier>>(BASE_URL, { params });
        return response.data;
    },

    async getById(id: number): Promise<Supplier> {
        const response = await api.get<Supplier>(`${BASE_URL}/${id}`);
        return response.data;
    },

    async create(data: SupplierCreate): Promise<Supplier> {
        const response = await api.post<Supplier>(BASE_URL, data);
        return response.data;
    },

    async update(id: number, data: SupplierUpdate): Promise<Supplier> {
        const response = await api.put<Supplier>(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`${BASE_URL}/${id}`);
    },

    async getCountries(): Promise<string[]> {
        const response = await api.get<string[]>(`${BASE_URL}/filters/countries`);
        return response.data;
    },

    async getCities(country?: string): Promise<string[]> {
        const params = country ? { country } : {};
        const response = await api.get<string[]>(`${BASE_URL}/filters/cities`, { params });
        return response.data;
    },
};
