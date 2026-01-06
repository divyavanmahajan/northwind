import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Categories } from '@/pages/Categories';
import { queryClient } from '@/lib/queryClient';
import { describe, it, expect, vi } from 'vitest';

// Mock the service
vi.mock('@/services/categoryService', () => ({
    categoryService: {
        getList: vi.fn().mockResolvedValue({
            data: [
                {
                    category_id: 1,
                    category_name: 'Beverages',
                    description: 'Soft drinks, coffees, teas, beers, and ales',
                    product_count: 5,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
            ],
            pagination: { page: 1, page_size: 25, total_items: 1, total_pages: 1 },
        }),
    },
}));

describe('Categories Page', () => {
    it('renders categories list', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Categories />
                </BrowserRouter>
            </QueryClientProvider>
        );

        // Should show the title
        expect(screen.getByText('Categories')).toBeDefined();

        // Should show the data from mock
        await waitFor(() => {
            expect(screen.getByText('Beverages')).toBeDefined();
        });
    });
});
