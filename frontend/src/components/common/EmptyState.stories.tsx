import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from './EmptyState'
import { Package, Users, ShoppingCart } from 'lucide-react'

const meta = {
    title: 'Common/EmptyState',
    component: EmptyState,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        title: {
            control: 'text',
            description: 'Title of the empty state',
        },
        description: {
            control: 'text',
            description: 'Description text',
        },
    },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const NoProducts: Story = {
    args: {
        icon: Package,
        title: 'No products found',
        description: 'Try adjusting your search or filter criteria',
    },
}

export const NoCustomers: Story = {
    args: {
        icon: Users,
        title: 'No customers yet',
        description: 'Start by adding your first customer',
        action: {
            label: 'Add Customer',
            onClick: () => alert('Add customer clicked'),
        },
    },
}

export const NoOrders: Story = {
    args: {
        icon: ShoppingCart,
        title: 'No orders found',
        description: 'Orders will appear here once created',
    },
}

export const WithAction: Story = {
    args: {
        icon: Package,
        title: 'Get started',
        description: 'Create your first item to begin',
        action: {
            label: 'Create Item',
            onClick: () => alert('Create clicked'),
        },
    },
}
