import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CustomerDetail } from '@/pages/CustomerDetail';
import { queryClient } from '@/lib/queryClient';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/store/authStore', () => ({
    useAuthStore: () => ({
        user: { role: 'admin' },
    }),
}));

vi.mock('@/hooks/useCustomers', () => ({
    useCustomer: vi.fn((id) => ({
        data: {
            customer_id: 'ALFKI',
            company_name: 'Alfreds Futterkiste',
            contact_name: 'Maria Anders',
            contact_title: 'Sales Representative',
            address: 'Obere Str. 57',
            city: 'Berlin',
            region: null,
            postal_code: '12209',
            country: 'Germany',
            phone: '030-0074321',
            fax: '030-0076545',
            statistics: {
                total_orders: 10,
                total_spent: 1000,
                average_order_value: 100,
                first_order_date: '2023-01-01T00:00:00',
                last_order_date: '2023-12-31T00:00:00'
            }
        },
        isLoading: false,
    })),
    useCustomerOrders: vi.fn().mockReturnValue({
        data: {
            data: [],
            pagination: { page: 1, total_pages: 0 }
        }
    }),
}));

describe('Customer Detail Page', () => {
    it('renders customer details and statistics', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <CustomerDetail />
                </BrowserRouter>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Alfreds Futterkiste')).toBeDefined();
            expect(screen.getByText('Maria Anders (Sales Representative)')).toBeDefined();
            expect(screen.getByText('Total Orders')).toBeDefined();
            expect(screen.getByText('10')).toBeDefined();
        });
    });

    it('shows edit button for admin', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <CustomerDetail />
                </BrowserRouter>
            </QueryClientProvider>
        );

        expect(screen.getByText('Edit')).toBeDefined();
    });
});
