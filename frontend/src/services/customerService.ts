import api from '@/lib/api';
import type { Customer, CustomerFilters, CustomerFormData } from '@/types/customer';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

const BASE_URL = '/customers';

export const customerService = {
    async getList(params: PaginationParams & CustomerFilters & { sort_by?: string; sort_order?: string } = {}): Promise<PaginatedResponse<Customer>> {
        const response = await api.get<PaginatedResponse<Customer>>(BASE_URL, { params });
        return response.data;
    },

    async getById(id: string): Promise<Customer> {
        const response = await api.get<Customer>(`${BASE_URL}/${id}`);
        return response.data;
    },

    async getMe(): Promise<Customer> {
        const response = await api.get<Customer>(`${BASE_URL}/me`);
        return response.data;
    },

    async create(data: CustomerFormData): Promise<Customer> {
        const response = await api.post<Customer>(BASE_URL, data);
        return response.data;
    },

    async update(id: string, data: Partial<CustomerFormData>): Promise<Customer> {
        const response = await api.put<Customer>(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`${BASE_URL}/${id}`);
    },

    async getCountries(): Promise<string[]> {
        const response = await api.get<string[]>(`${BASE_URL}/countries`);
        return response.data;
    },

    async getCities(country?: string): Promise<string[]> {
        const params = country ? { country } : {};
        const response = await api.get<string[]>(`${BASE_URL}/cities`, { params });
        return response.data;
    },

    async getOrders(id: string, params: PaginationParams = {}): Promise<PaginatedResponse<any>> {
        const response = await api.get<PaginatedResponse<any>>(`${BASE_URL}/${id}/orders`, { params });
        return response.data;
    }
};
