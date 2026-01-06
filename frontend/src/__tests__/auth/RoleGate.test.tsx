import { render, screen } from '@testing-library/react';
import { RoleGate, AdminOnly } from '@/components/auth/RoleGate';
import { useAuthStore } from '@/store/authStore';
import { describe, it, expect, beforeEach } from 'vitest';

describe('RoleGate', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            permissions: [],
        });
    });

    it('shows children when role matches', () => {
        useAuthStore.setState({
            user: { user_id: '1', username: 'admin', role: 'admin', is_active: true, email: 'admin@example.com', created_at: '', updated_at: '', last_login: null },
            isAuthenticated: true,
            permissions: ['user:create'],
        });

        render(
            <RoleGate roles={['admin']}>
                <div>Admin Content</div>
            </RoleGate>
        );

        expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('shows fallback when role does not match', () => {
        useAuthStore.setState({
            user: { user_id: '1', username: 'user', role: 'customer', is_active: true, email: 'user@example.com', created_at: '', updated_at: '', last_login: null },
            isAuthenticated: true,
            permissions: [],
        });

        render(
            <AdminOnly fallback={<div>Not Admin</div>}>
                <div>Admin Content</div>
            </AdminOnly>
        );

        expect(screen.getByText('Not Admin')).toBeInTheDocument();
    });
});
