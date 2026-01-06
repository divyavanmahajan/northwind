import api from '@/lib/api';
import type { LoginRequest, LoginResponse, User } from '@/types/auth';

const AUTH_BASE = '/auth';

export const authService = {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>(`${AUTH_BASE}/login`, credentials);
        return response.data;
    },

    async getMe(): Promise<User> {
        const response = await api.get<User>(`${AUTH_BASE}/me`);
        return response.data;
    },

    async getPermissions(): Promise<{ permissions: string[] }> {
        const response = await api.get<{ permissions: string[] }>(
            `${AUTH_BASE}/me/permissions`
        );
        return response.data;
    },

    logout(): void {
        // Client-side logout - clear token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};
