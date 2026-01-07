import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { DataTable } from './DataTable'
import type { ColumnDef } from '@tanstack/react-table'

interface Product {
    id: number
    name: string
    category: string
    price: number
    stock: number
}

const sampleProducts: Product[] = [
    { id: 1, name: 'Laptop', category: 'Electronics', price: 999.99, stock: 15 },
    { id: 2, name: 'Mouse', category: 'Electronics', price: 29.99, stock: 50 },
    { id: 3, name: 'Keyboard', category: 'Electronics', price: 79.99, stock: 30 },
    { id: 4, name: 'Monitor', category: 'Electronics', price: 299.99, stock: 20 },
    { id: 5, name: 'Desk Chair', category: 'Furniture', price: 199.99, stock: 10 },
]

const columns: ColumnDef<Product>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'name',
        header: 'Product Name',
    },
    {
        accessorKey: 'category',
        header: 'Category',
    },
    {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => {
            const price = parseFloat(row.getValue('price'))
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(price)
            return <div className="font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => {
            const stock = row.getValue('stock') as number
            return (
                <div className={stock < 20 ? 'text-red-600' : 'text-green-600'}>
                    {stock}
                </div>
            )
        },
    },
]

const meta = {
    title: 'Common/DataTable',
    component: DataTable,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof DataTable<Product>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        columns,
        data: sampleProducts,
    },
}

export const WithActions: Story = {
    args: {
        columns,
        data: sampleProducts,
        onEdit: fn(),
        onDelete: fn(),
    },
}

export const EmptyTable: Story = {
    args: {
        columns,
        data: [],
    },
}

export const Loading: Story = {
    args: {
        columns,
        data: [],
        isLoading: true,
    },
}

export const LargeDataset: Story = {
    args: {
        columns,
        data: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            category: i % 2 === 0 ? 'Electronics' : 'Furniture',
            price: Math.random() * 1000,
            stock: Math.floor(Math.random() * 100),
        })),
    },
}
