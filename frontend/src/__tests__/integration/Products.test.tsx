import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Products } from '@/pages/Products';
import { queryClient } from '@/lib/queryClient';
import { describe, it, expect, vi } from 'vitest';
import { UserRole } from '@/types/user';

// Mock auth store
vi.mock('@/store/authStore', () => ({
    useAuthStore: () => ({
        user: { role: UserRole.ADMIN },
    }),
}));

// Mock the hooks
vi.mock('@/hooks/useProducts', () => ({
    useProducts: vi.fn().mockReturnValue({
        data: {
            data: [
                {
                    product_id: 1,
                    product_name: 'Chai',
                    category_name: 'Beverages',
                    supplier_name: 'Supplier A',
                    unit_price: 18.0,
                    units_in_stock: 39,
                    stock_status: 'in_stock',
                    discontinued: false,
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
    useDeleteProduct: vi.fn().mockReturnValue({
        mutateAsync: vi.fn(),
    }),
    useCategoryOptions: vi.fn().mockReturnValue({ data: [] }),
    useSupplierOptions: vi.fn().mockReturnValue({ data: [] }),
}));

describe('Products Page', () => {
    it('renders products list', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Products />
                </BrowserRouter>
            </QueryClientProvider>
        );

        // Should show the title
        expect(screen.getByText('Products')).toBeDefined();

        // Should show the data from mock
        await waitFor(() => {
            expect(screen.getByText('Chai')).toBeDefined();
            expect(screen.getByText('Beverages')).toBeDefined();
            expect(screen.getByText('Supplier A')).toBeDefined();
            expect(screen.getByText('In Stock')).toBeDefined();
        });
    });

    it('shows add product button for admin', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Products />
                </BrowserRouter>
            </QueryClientProvider>
        );

        expect(screen.getByText('Add Product')).toBeDefined();
    });
});
