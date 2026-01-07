import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Pagination } from './Pagination'

const meta = {
    title: 'Common/Pagination',
    component: Pagination,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    args: {
        onPageChange: fn(),
        onPageSizeChange: fn(),
    },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const FirstPage: Story = {
    args: {
        page: 1,
        pageSize: 10,
        totalItems: 100,
        totalPages: 10,
    },
}

export const MiddlePage: Story = {
    args: {
        page: 5,
        pageSize: 10,
        totalItems: 100,
        totalPages: 10,
    },
}

export const LastPage: Story = {
    args: {
        page: 10,
        pageSize: 10,
        totalItems: 100,
        totalPages: 10,
    },
}

export const LargePageSize: Story = {
    args: {
        page: 1,
        pageSize: 50,
        totalItems: 100,
        totalPages: 2,
    },
}

export const NoResults: Story = {
    args: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    },
}

export const CustomPageSizes: Story = {
    args: {
        page: 1,
        pageSize: 20,
        totalItems: 200,
        totalPages: 10,
        pageSizeOptions: [20, 40, 60, 100],
    },
}
