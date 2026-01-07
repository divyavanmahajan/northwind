import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Mail, Loader2 } from 'lucide-react'

const meta = {
    title: 'UI/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
        },
        size: {
            control: 'select',
            options: ['default', 'sm', 'lg', 'icon'],
        },
    },
    args: {
        onClick: () => console.log('Button clicked'),
    },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        children: 'Button',
    },
}

export const Destructive: Story = {
    args: {
        variant: 'destructive',
        children: 'Delete',
    },
}

export const Outline: Story = {
    args: {
        variant: 'outline',
        children: 'Outline',
    },
}

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Secondary',
    },
}

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        children: 'Ghost',
    },
}

export const Link: Story = {
    args: {
        variant: 'link',
        children: 'Link',
    },
}

export const Small: Story = {
    args: {
        size: 'sm',
        children: 'Small',
    },
}

export const Large: Story = {
    args: {
        size: 'lg',
        children: 'Large',
    },
}

export const WithIcon: Story = {
    args: {
        children: (
            <>
                <Mail className="mr-2 h-4 w-4" />
                Login with Email
            </>
        ),
    },
}

export const IconOnly: Story = {
    args: {
        size: 'icon',
        children: <Mail className="h-4 w-4" />,
    },
}

export const Loading: Story = {
    args: {
        disabled: true,
        children: (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
            </>
        ),
    },
}

export const Disabled: Story = {
    args: {
        disabled: true,
        children: 'Disabled',
    },
}

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <Button>Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
            </div>
            <div className="flex gap-2">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
            </div>
        </div>
    ),
}
