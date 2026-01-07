import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ProtectedRoute', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        });
    });

    it('redirects to login when not authenticated', () => {
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute>
                                <div>Protected Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('shows content when authenticated', () => {
        useAuthStore.setState({
            user: { user_id: '1', username: 'test', role: 'admin', is_active: true, email: 'test@example.com', created_at: '', updated_at: '', last_login: null },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
        });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute>
                                <div>Protected Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('shows unauthorized for wrong role', () => {
        useAuthStore.setState({
            user: { user_id: '1', username: 'test', role: 'customer', is_active: true, email: 'test@example.com', created_at: '', updated_at: '', last_login: null },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
        });

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute roles={['admin']}>
                                <div>Admin Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });
});
