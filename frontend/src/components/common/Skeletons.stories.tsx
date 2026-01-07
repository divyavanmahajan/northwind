import type { Meta, StoryObj } from '@storybook/react'
import { TableSkeleton, CardSkeleton, PageSkeleton } from './Skeletons'

const meta = {
    title: 'Common/Skeletons',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta

export default meta

export const Table: StoryObj = {
    render: () => <TableSkeleton rows={5} columns={4} />,
}

export const TableWithManyRows: StoryObj = {
    render: () => <TableSkeleton rows={10} columns={6} />,
}

export const Card: StoryObj = {
    render: () => (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
    ),
}

export const Page: StoryObj = {
    render: () => <PageSkeleton />,
}
