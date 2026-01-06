import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from '../CategoryForm';
import type { Category } from '@/types/category';

describe('CategoryForm', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    const defaultProps = {
        onSubmit: mockOnSubmit,
        onCancel: mockOnCancel,
        isSubmitting: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render create form correctly', () => {
        render(<CategoryForm {...defaultProps} />);

        expect(screen.getByText('Create Category')).toBeInTheDocument();
        expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render edit form with initial data', () => {
        const category: Category = {
            category_id: 1,
            category_name: 'Beverages',
            description: 'Soft drinks',
            product_count: 5,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
        };

        render(<CategoryForm {...defaultProps} category={category} />);

        expect(screen.getByText('Edit Category')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Beverages')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Soft drinks')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
        const user = userEvent.setup();
        render(<CategoryForm {...defaultProps} />);

        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/category name is required/i)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate category name length', async () => {
        const user = userEvent.setup();
        render(<CategoryForm {...defaultProps} />);

        const nameInput = screen.getByLabelText(/category name/i);
        await user.type(nameInput, 'A'.repeat(101)); // Exceeds max length of 100

        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(
                screen.getByText(/category name must be at most 100 characters/i)
            ).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate description length', async () => {
        const user = userEvent.setup();
        render(<CategoryForm {...defaultProps} />);

        const nameInput = screen.getByLabelText(/category name/i);
        const descriptionInput = screen.getByLabelText(/description/i);

        await user.type(nameInput, 'Test Category');
        await user.type(descriptionInput, 'A'.repeat(501)); // Exceeds max length of 500

        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(
                screen.getByText(/description must be at most 500 characters/i)
            ).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit valid form data for creation', async () => {
        const user = userEvent.setup();
        render(<CategoryForm {...defaultProps} />);

        const nameInput = screen.getByLabelText(/category name/i);
        const descriptionInput = screen.getByLabelText(/description/i);

        await user.type(nameInput, 'New Category');
        await user.type(descriptionInput, 'New description');

        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                category_name: 'New Category',
                description: 'New description',
            });
        });
    });

    it('should submit valid form data for update', async () => {
        const user = userEvent.setup();
        const category: Category = {
            category_id: 1,
            category_name: 'Beverages',
            description: 'Soft drinks',
            product_count: 5,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
        };

        render(<CategoryForm {...defaultProps} category={category} />);

        const nameInput = screen.getByLabelText(/category name/i);
        const descriptionInput = screen.getByLabelText(/description/i);

        await user.clear(nameInput);
        await user.type(nameInput, 'Updated Category');
        await user.clear(descriptionInput);
        await user.type(descriptionInput, 'Updated description');

        const submitButton = screen.getByRole('button', { name: /save/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                category_name: 'Updated Category',
                description: 'Updated description',
            });
        });
    });

    it('should disable submit button when submitting', () => {
        render(<CategoryForm {...defaultProps} isSubmitting={true} />);

        const submitButton = screen.getByRole('button', { name: /creating/i });
        expect(submitButton).toBeDisabled();
    });

    it('should call onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<CategoryForm {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should trim whitespace from inputs', async () => {
        const user = userEvent.setup();
        render(<CategoryForm {...defaultProps} />);

        const nameInput = screen.getByLabelText(/category name/i);
        const descriptionInput = screen.getByLabelText(/description/i);

        await user.type(nameInput, '  Trimmed Category  ');
        await user.type(descriptionInput, '  Trimmed description  ');

        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                category_name: 'Trimmed Category',
                description: 'Trimmed description',
            });
        });
    });

    it('should allow empty description', async () => {
        const user = userEvent.setup();
        render(<CategoryForm {...defaultProps} />);

        const nameInput = screen.getByLabelText(/category name/i);
        await user.type(nameInput, 'Category Without Description');

        const submitButton = screen.getByRole('button', { name: /create/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                category_name: 'Category Without Description',
                description: '',
            });
        });
    });
});
