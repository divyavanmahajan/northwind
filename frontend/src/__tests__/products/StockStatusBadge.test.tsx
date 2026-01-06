import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StockStatusBadge } from '@/components/features/products/StockStatusBadge';

describe('StockStatusBadge', () => {
    it('renders correctly for in_stock status', () => {
        render(<StockStatusBadge status="in_stock" />);
        const badge = screen.getByText('In Stock');
        expect(badge).toBeDefined();
        expect(badge.className).toContain('bg-green-500');
    });

    it('renders correctly for low_stock status', () => {
        render(<StockStatusBadge status="low_stock" />);
        const badge = screen.getByText('Low Stock');
        expect(badge).toBeDefined();
        expect(badge.className).toContain('bg-yellow-500');
    });

    it('renders correctly for out_of_stock status', () => {
        render(<StockStatusBadge status="out_of_stock" />);
        const badge = screen.getByText('Out of Stock');
        expect(badge).toBeDefined();
        expect(badge.className).toContain('bg-red-500');
    });

    it('renders correctly for discontinued status', () => {
        render(<StockStatusBadge status="discontinued" />);
        const badge = screen.getByText('Discontinued');
        expect(badge).toBeDefined();
        expect(badge.className).toContain('bg-gray-500');
    });

    it('renders default (in_stock) for unknown status', () => {
        render(<StockStatusBadge status="unknown_status" />);
        const badge = screen.getByText('In Stock');
        expect(badge).toBeDefined();
        expect(badge.className).toContain('bg-green-500');
    });
});
