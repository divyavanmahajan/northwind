import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/auth';
import { authService } from '@/services/authService';
import api from '@/lib/api';

interface AuthState {
    user: User | null;
    token: string | null;
    permissions: string[];
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    clearError: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            permissions: [],
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (username: string, password: string) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await authService.login({ username, password });

                    // Set token in API client
                    api.defaults.headers.common['Authorization'] =
                        `Bearer ${response.access_token}`;

                    // Fetch permissions
                    const permData = await authService.getPermissions();

                    set({
                        user: response.user,
                        token: response.access_token,
                        permissions: permData.permissions,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: any) {
                    const message = error.response?.data?.error?.message ||
                        error.response?.data?.detail ||
                        error.message ||
                        'Login failed';
                    set({
                        user: null,
                        token: null,
                        permissions: [],
                        isAuthenticated: false,
                        isLoading: false,
                        error: message,
                    });
                    throw error;
                }
            },

            logout: () => {
                authService.logout();
                delete api.defaults.headers.common['Authorization'];
                set({
                    user: null,
                    token: null,
                    permissions: [],
                    isAuthenticated: false,
                    error: null,
                });
            },

            refreshUser: async () => {
                const { token } = get();
                if (!token) return;

                set({ isLoading: true });
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const user = await authService.getMe();
                    const permData = await authService.getPermissions();
                    set({
                        user,
                        permissions: permData.permissions,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    // Token invalid or network error, logout
                    get().logout();
                    set({ isLoading: false });
                }
            },

            clearError: () => set({ error: null }),
            setLoading: (loading: boolean) => set({ isLoading: loading }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                permissions: state.permissions,
            }),
        }
    )
);
