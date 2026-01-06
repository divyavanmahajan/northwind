import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductFilterPanel } from '@/components/features/products/ProductFilterPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('@/hooks/useProducts', () => ({
    useCategoryOptions: vi.fn().mockReturnValue({
        data: [
            { value: 1, label: 'Beverages' },
            { value: 2, label: 'Condiments' },
        ],
    }),
    useSupplierOptions: vi.fn().mockReturnValue({
        data: [
            { value: 1, label: 'Supplier A' },
            { value: 2, label: 'Supplier B' },
        ],
    }),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const defaultProps = {
    filters: {},
    onFiltersChange: vi.fn(),
    onClear: vi.fn(),
};

describe('ProductFilterPanel', () => {
    it('renders filter button', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ProductFilterPanel {...defaultProps} />
            </QueryClientProvider>
        );
        expect(screen.getByText('Filters')).toBeDefined();
    });

    it('expands panel when filter button is clicked', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ProductFilterPanel {...defaultProps} />
            </QueryClientProvider>
        );

        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);

        expect(screen.getByText('Category')).toBeDefined();
        expect(screen.getByText('Supplier')).toBeDefined();
        expect(screen.getByText('Stock Status')).toBeDefined();
        expect(screen.getByText('Price Range')).toBeDefined();
    });

    it('shows active filter count badge', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ProductFilterPanel
                    {...defaultProps}
                    filters={{ category_id: 1, stock_status: 'in_stock' }}
                />
            </QueryClientProvider>
        );

        const badge = screen.getByText('2');
        expect(badge).toBeDefined();
    });

    it('shows clear all button when filters are active', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ProductFilterPanel
                    {...defaultProps}
                    filters={{ category_id: 1 }}
                />
            </QueryClientProvider>
        );

        const clearButton = screen.getByText('Clear all');
        expect(clearButton).toBeDefined();

        fireEvent.click(clearButton);
        expect(defaultProps.onClear).toHaveBeenCalled();
    });
});
