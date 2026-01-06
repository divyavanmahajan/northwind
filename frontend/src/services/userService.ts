import api from './api';
import type { UserListItem, User, UserCreate, UserUpdate, PasswordReset } from '@/types/user';
import type { PaginatedResponse } from '@/types/api';

export const userService = {
    async getList(params: {
        page?: number;
        page_size?: number;
        search?: string;
        role?: string;
        is_active?: boolean;
    }): Promise<PaginatedResponse<UserListItem>> {
        const response = await api.get('/users', { params });
        return response.data;
    },

    async getById(id: string): Promise<User> {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    async create(data: UserCreate): Promise<User> {
        const response = await api.post('/users', data);
        return response.data;
    },

    async update(id: string, data: UserUpdate): Promise<User> {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },

    async activate(id: string): Promise<void> {
        await api.patch(`/users/${id}/activate`);
    },

    async deactivate(id: string): Promise<void> {
        await api.patch(`/users/${id}/deactivate`);
    },

    async resetPassword(id: string, data: PasswordReset): Promise<void> {
        await api.patch(`/users/${id}/reset-password`, data);
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    },
};
