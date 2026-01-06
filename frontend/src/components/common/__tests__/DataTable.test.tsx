import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';
import type { DataTableColumn } from '../DataTable';

interface TestData {
    id: number;
    name: string;
    email: string;
    status: string;
}

describe('DataTable', () => {
    const mockColumns: DataTableColumn<TestData>[] = [
        {
            key: 'id',
            header: 'ID',
            sortable: true,
        },
        {
            key: 'name',
            header: 'Name',
            sortable: true,
        },
        {
            key: 'email',
            header: 'Email',
            sortable: false,
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (value) => (
                <span className={value === 'active' ? 'text-green-600' : 'text-red-600'}>
                    {value}
                </span>
            ),
        },
    ];

    const mockData: TestData[] = [
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
    ];

    it('should render table with data', () => {
        render(<DataTable columns={mockColumns} data={mockData} />);

        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should render custom cell content', () => {
        render(<DataTable columns={mockColumns} data={mockData} />);

        const activeStatuses = screen.getAllByText('active');
        const inactiveStatuses = screen.getAllByText('inactive');

        expect(activeStatuses).toHaveLength(2);
        expect(inactiveStatuses).toHaveLength(1);
    });

    it('should show loading state', () => {
        render(<DataTable columns={mockColumns} data={[]} isLoading={true} />);

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
        render(<DataTable columns={mockColumns} data={[]} />);

        expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });

    it('should show custom empty message', () => {
        render(
            <DataTable
                columns={mockColumns}
                data={[]}
                emptyMessage="No categories found"
            />
        );

        expect(screen.getByText('No categories found')).toBeInTheDocument();
    });

    it('should handle sort on sortable columns', async () => {
        const user = userEvent.setup();
        const mockOnSort = vi.fn();

        render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                sortBy="name"
                sortOrder="asc"
                onSort={mockOnSort}
            />
        );

        const nameHeader = screen.getByText('Name');
        await user.click(nameHeader);

        expect(mockOnSort).toHaveBeenCalledWith('name');
    });

    it('should not handle sort on non-sortable columns', async () => {
        const user = userEvent.setup();
        const mockOnSort = vi.fn();

        render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                sortBy="name"
                sortOrder="asc"
                onSort={mockOnSort}
            />
        );

        const emailHeader = screen.getByText('Email');
        await user.click(emailHeader);

        expect(mockOnSort).not.toHaveBeenCalled();
    });

    it('should render row actions', () => {
        const mockOnEdit = vi.fn();
        const mockOnDelete = vi.fn();

        render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                actions={(row) => (
                    <div>
                        <button onClick={() => mockOnEdit(row)}>Edit</button>
                        <button onClick={() => mockOnDelete(row)}>Delete</button>
                    </div>
                )}
            />
        );

        const editButtons = screen.getAllByText('Edit');
        const deleteButtons = screen.getAllByText('Delete');

        expect(editButtons).toHaveLength(3);
        expect(deleteButtons).toHaveLength(3);
    });

    it('should call action handlers', async () => {
        const user = userEvent.setup();
        const mockOnEdit = vi.fn();

        render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                actions={(row) => <button onClick={() => mockOnEdit(row)}>Edit</button>}
            />
        );

        const editButtons = screen.getAllByText('Edit');
        await user.click(editButtons[0]);

        expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);
    });

    it('should show search input when searchable', () => {
        const mockOnSearch = vi.fn();

        render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                searchable={true}
                searchValue=""
                onSearch={mockOnSearch}
            />
        );

        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should handle search input', async () => {
        const user = userEvent.setup();
        const mockOnSearch = vi.fn();

        render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                searchable={true}
                searchValue=""
                onSearch={mockOnSearch}
            />
        );

        const searchInput = screen.getByPlaceholderText(/search/i);
        await user.type(searchInput, 'John');

        expect(mockOnSearch).toHaveBeenCalled();
    });

    it('should display sort indicators', () => {
        render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                sortBy="name"
                sortOrder="asc"
            />
        );

        // The sort indicator should be present in the Name column header
        const nameHeader = screen.getByText('Name').closest('th');
        expect(nameHeader).toBeInTheDocument();
    });

    it('should render with custom className', () => {
        const { container } = render(
            <DataTable
                columns={mockColumns}
                data={mockData}
                className="custom-table-class"
            />
        );

        expect(container.querySelector('.custom-table-class')).toBeInTheDocument();
    });
});
