import type { Meta, StoryObj } from '@storybook/react'
import { LoadingSpinner } from './LoadingSpinner'

const meta = {
    title: 'Common/LoadingSpinner',
    component: LoadingSpinner,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Size of the spinner',
        },
    },
} satisfies Meta<typeof LoadingSpinner>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
    args: {
        size: 'sm',
    },
}

export const Medium: Story = {
    args: {
        size: 'md',
    },
}

export const Large: Story = {
    args: {
        size: 'lg',
    },
}

export const Default: Story = {
    args: {},
}
