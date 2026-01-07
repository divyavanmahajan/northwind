import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Customers } from '@/pages/Customers';
import { queryClient } from '@/lib/queryClient';
import { describe, it, expect, vi } from 'vitest';


vi.mock('@/store/authStore', () => ({
    useAuthStore: () => ({
        user: { role: 'admin' },
    }),
}));

vi.mock('@/hooks/useCustomers', () => ({
    useCustomers: vi.fn().mockReturnValue({
        data: {
            data: [
                {
                    customer_id: 'ALFKI',
                    company_name: 'Alfreds Futterkiste',
                    contact_name: 'Maria Anders',
                    country: 'Germany',
                    city: 'Berlin',
                    phone: '030-0074321',
                    order_count: 5
                },
            ],
            pagination: {
                page: 1,
                page_size: 10,
                total_items: 1,
                total_pages: 1,
                has_next: false,
                has_previous: false,
            },
        },
        isLoading: false,
        isError: false,
    }),
    useDeleteCustomer: vi.fn().mockReturnValue({
        mutateAsync: vi.fn(),
    }),
}));

describe('Customers Page', () => {
    it('renders customers list', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Customers />
                </BrowserRouter>
            </QueryClientProvider>
        );

        expect(screen.getByText('Customers')).toBeDefined();
        await waitFor(() => {
            expect(screen.getByText('Alfreds Futterkiste')).toBeDefined();
            expect(screen.getByText('Maria Anders')).toBeDefined();
            expect(screen.getByText('Germany')).toBeDefined();
        });
    });

    it('shows add customer button for admin', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Customers />
                </BrowserRouter>
            </QueryClientProvider>
        );

        expect(screen.getByText('Add Customer')).toBeDefined();
    });
});
