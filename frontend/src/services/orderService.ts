import api from '@/lib/api';
import type { Order, OrderListResponse, CreateOrderData, UpdateOrderData, OrderFilterParams, OrderStatus } from '../types/order';
import type { PaginatedResponse } from '../types/api';

export const orderService = {
    async getAll(params?: OrderFilterParams): Promise<PaginatedResponse<OrderListResponse>> {
        const response = await api.get<PaginatedResponse<OrderListResponse>>('/orders', { params });
        return response.data;
    },

    async getById(id: number): Promise<Order> {
        const response = await api.get<Order>(`/orders/${id}`);
        return response.data;
    },

    async create(data: CreateOrderData): Promise<Order> {
        const response = await api.post<Order>('/orders', data);
        return response.data;
    },

    async update(id: number, data: UpdateOrderData): Promise<Order> {
        const response = await api.put<Order>(`/orders/${id}`, data);
        return response.data;
    },

    async updateStatus(id: number, status: OrderStatus): Promise<Order> {
        const response = await api.patch<Order>(`/orders/${id}/status`, null, { params: { status } });
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/orders/${id}`);
    },

    async getStatuses(): Promise<string[]> {
        const response = await api.get<string[]>('/orders/filters/statuses');
        return response.data;
    },
};
