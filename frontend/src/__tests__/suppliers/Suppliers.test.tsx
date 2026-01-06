import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Suppliers } from '@/pages/Suppliers';
import { queryClient } from '@/lib/queryClient';
import { describe, it, expect, vi } from 'vitest';

// Mock the services
vi.mock('@/services/supplierService', () => ({
    supplierService: {
        getList: vi.fn().mockResolvedValue({
            data: [
                {
                    supplier_id: 1,
                    company_name: 'Test Supplier',
                    contact_name: 'John Doe',
                    city: 'London',
                    country: 'UK',
                    product_count: 5,
                },
            ],
            pagination: { page: 1, page_size: 25, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
        getCountries: vi.fn().mockResolvedValue(['UK', 'USA']),
        getCities: vi.fn().mockResolvedValue(['London', 'New York']),
    },
}));

// Mock auth store
vi.mock('@/store/authStore', () => ({
    useAuthStore: () => ({
        user: { role: 'admin' },
    }),
}));

describe('Suppliers Page', () => {
    it('renders suppliers list and filters', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Suppliers />
                </BrowserRouter>
            </QueryClientProvider>
        );

        expect(screen.getByText('Suppliers')).toBeDefined();
        expect(screen.getByPlaceholderText('Search suppliers...')).toBeDefined();

        await waitFor(() => {
            expect(screen.getByText('Test Supplier')).toBeDefined();
            expect(screen.getByText('John Doe')).toBeDefined();
        });
    });
});
