import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductForm } from '@/components/features/products/ProductForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Polyfill ResizeObserver
vi.stubGlobal('ResizeObserver', class {
    observe() { }
    unobserve() { }
    disconnect() { }
});

// Mock hook-form resovlers to avoid zod issues in tests if any, 
// but actually we are testing with real resolver logic mostly.
// Just mocking the options hooks
vi.mock('@/hooks/useProducts', () => ({
    useCategoryOptions: vi.fn().mockReturnValue({
        data: [
            { value: 1, label: 'Beverages' },
        ],
    }),
    useSupplierOptions: vi.fn().mockReturnValue({
        data: [
            { value: 1, label: 'Supplier A' },
        ],
    }),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
    },
});

describe('ProductForm', () => {
    const mockSubmit = vi.fn();
    const mockCancel = vi.fn();

    beforeEach(() => {
        mockSubmit.mockReset();
        mockCancel.mockReset();
    });

    it('renders form fields', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ProductForm onSubmit={mockSubmit} onCancel={mockCancel} />
            </QueryClientProvider>
        );

        expect(screen.getByLabelText(/Product Name/i)).toBeDefined();
        expect(screen.getByLabelText(/Category/i)).toBeDefined();
        expect(screen.getByLabelText(/Supplier/i)).toBeDefined();
        expect(screen.getByLabelText(/Unit Price/i)).toBeDefined();
    });

    it('submits form with valid data', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ProductForm onSubmit={mockSubmit} onCancel={mockCancel} />
            </QueryClientProvider>
        );

        fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'New Tea' } });
        fireEvent.change(screen.getByLabelText(/Unit Price/i), { target: { value: '10.50' } });

        // Submit
        fireEvent.click(screen.getByText('Create Product'));

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalled();
        });

        const submittedData = mockSubmit.mock.calls[0][0];
        expect(submittedData.product_name).toBe('New Tea');
        expect(submittedData.unit_price).toBe(10.50);
    });

    it('validates required fields', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <ProductForm onSubmit={mockSubmit} onCancel={mockCancel} />
            </QueryClientProvider>
        );

        // Submit without name
        fireEvent.click(screen.getByText('Create Product'));

        await waitFor(() => {
            expect(screen.getByText('Product name is required')).toBeDefined();
        });

        expect(mockSubmit).not.toHaveBeenCalled();
    });
});
