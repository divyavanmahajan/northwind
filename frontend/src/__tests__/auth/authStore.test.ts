import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';

// Mock authService
vi.mock('@/services/authService', () => ({
    authService: {
        login: vi.fn(),
        getMe: vi.fn(),
        getPermissions: vi.fn(),
        logout: vi.fn(),
    },
}));

describe('AuthStore', () => {
    beforeEach(() => {
        act(() => {
            useAuthStore.getState().logout();
        });
        vi.clearAllMocks();
    });

    it('should start with no user', () => {
        const { result } = renderHook(() => useAuthStore());
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear error on clearError', () => {
        const { result } = renderHook(() => useAuthStore());
        act(() => {
            useAuthStore.setState({ error: 'Some error' });
        });
        expect(result.current.error).toBe('Some error');
        act(() => {
            result.current.clearError();
        });
        expect(result.current.error).toBeNull();
    });
});
