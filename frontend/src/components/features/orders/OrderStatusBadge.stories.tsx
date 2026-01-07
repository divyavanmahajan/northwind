import type { Meta, StoryObj } from '@storybook/react'
import { OrderStatusBadge } from './OrderStatusBadge'

const meta = {
    title: 'Features/Orders/OrderStatusBadge',
    component: OrderStatusBadge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        status: {
            control: 'select',
            options: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            description: 'Order status',
        },
    },
} satisfies Meta<typeof OrderStatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {
    args: {
        status: 'pending',
    },
}

export const Processing: Story = {
    args: {
        status: 'processing',
    },
}

export const Shipped: Story = {
    args: {
        status: 'shipped',
    },
}

export const Delivered: Story = {
    args: {
        status: 'delivered',
    },
}

export const Cancelled: Story = {
    args: {
        status: 'cancelled',
    },
}

export const AllStatuses: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            <OrderStatusBadge status="pending" />
            <OrderStatusBadge status="processing" />
            <OrderStatusBadge status="shipped" />
            <OrderStatusBadge status="delivered" />
            <OrderStatusBadge status="cancelled" />
        </div>
    ),
}
