import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
    const mockOnPageChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render pagination info', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                pageSize={25}
                total={100}
                onPageChange={mockOnPageChange}
            />
        );

        expect(screen.getByText(/showing 1-25 of 100/i)).toBeInTheDocument();
    });

    it('should render page buttons', () => {
        render(
            <Pagination
                currentPage={3}
                totalPages={5}
                pageSize={25}
                total={100}
                onPageChange={mockOnPageChange}
            />
        );

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                pageSize={25}
                total={100}
                onPageChange={mockOnPageChange}
            />
        );

        const prevButton = screen.getByLabelText(/previous page/i);
        expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
        render(
            <Pagination
                currentPage={5}
                totalPages={5}
                pageSize={25}
                total={100}
                onPageChange={mockOnPageChange}
            />
        );

        const nextButton = screen.getByLabelText(/next page/i);
        expect(nextButton).toBeDisabled();
    });

    it('should call onPageChange when clicking page number', async () => {
        const user = userEvent.setup();
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                pageSize={25}
                total={100}
                onPageChange={mockOnPageChange}
            />
        );

        const page3Button = screen.getByText('3');
        await user.click(page3Button);

        expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should call onPageChange when clicking next button', async () => {
        const user = userEvent.setup();
        render(
            <Pagination
                currentPage={2}
                totalPages={5}
                pageSize={25}
                total={100}
                onPageChange={mockOnPageChange}
            />
        );

        const nextButton = screen.getByLabelText(/next page/i);
        await user.click(nextButton);

        expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should call onPageChange when clicking previous button', async () => {
        const user = userEvent.setup();
        render(
            <Pagination
                currentPage={3}
                totalPages={5}
                pageSize={25}
                total={100}
                onPageChange={mockOnPageChange}
            />
        );

        const prevButton = screen.getByLabelText(/previous page/i);
        await user.click(prevButton);

        expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should highlight current page', () => {
        render(
            <Pagination
                currentPage={3}
                totalPages={5}
                pageSize={25}
                total={100}
                onPageChange={mockOnPageChange}
            />
        );

        const page3Button = screen.getByText('3');
        expect(page3Button).toHaveAttribute('aria-current', 'page');
    });

    it('should show ellipsis for large page counts', () => {
        render(
            <Pagination
                currentPage={5}
                totalPages={20}
                pageSize={25}
                total={500}
                onPageChange={mockOnPageChange}
            />
        );

        const ellipses = screen.getAllByText('...');
        expect(ellipses.length).toBeGreaterThan(0);
    });

    it('should show correct range for middle pages', () => {
        render(
            <Pagination
                currentPage={10}
                totalPages={20}
                pageSize={25}
                total={500}
                onPageChange={mockOnPageChange}
            />
        );

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should calculate correct item range for last page', () => {
        render(
            <Pagination
                currentPage={5}
                totalPages={5}
                pageSize={25}
                total={110}
                onPageChange={mockOnPageChange}
            />
        );

        expect(screen.getByText(/showing 101-110 of 110/i)).toBeInTheDocument();
    });

    it('should handle single page correctly', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={1}
                pageSize={25}
                total={10}
                onPageChange={mockOnPageChange}
            />
        );

        const prevButton = screen.getByLabelText(/previous page/i);
        const nextButton = screen.getByLabelText(/next page/i);

        expect(prevButton).toBeDisabled();
        expect(nextButton).toBeDisabled();
    });

    it('should not render when totalPages is 0', () => {
        const { container } = render(
            <Pagination
                currentPage={1}
                totalPages={0}
                pageSize={25}
                total={0}
                onPageChange={mockOnPageChange}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should show first and last page buttons', async () => {
        const user = userEvent.setup();
        render(
            <Pagination
                currentPage={10}
                totalPages={20}
                pageSize={25}
                total={500}
                onPageChange={mockOnPageChange}
                showFirstLast={true}
            />
        );

        const firstButton = screen.getByLabelText(/first page/i);
        const lastButton = screen.getByLabelText(/last page/i);

        expect(firstButton).toBeInTheDocument();
        expect(lastButton).toBeInTheDocument();

        await user.click(firstButton);
        expect(mockOnPageChange).toHaveBeenCalledWith(1);

        await user.click(lastButton);
        expect(mockOnPageChange).toHaveBeenCalledWith(20);
    });

    it('should disable first button on first page', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={20}
                pageSize={25}
                total={500}
                onPageChange={mockOnPageChange}
                showFirstLast={true}
            />
        );

        const firstButton = screen.getByLabelText(/first page/i);
        expect(firstButton).toBeDisabled();
    });

    it('should disable last button on last page', () => {
        render(
            <Pagination
                currentPage={20}
                totalPages={20}
                pageSize={25}
                total={500}
                onPageChange={mockOnPageChange}
                showFirstLast={true}
            />
        );

        const lastButton = screen.getByLabelText(/last page/i);
        expect(lastButton).toBeDisabled();
    });
});
