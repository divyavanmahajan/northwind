import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserRole, type UserListItem, type UserCreate, type UserUpdate } from '@/types/user';

const userSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
    role: z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.CUSTOMER]),
    is_active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
    user?: UserListItem;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
    const form = useForm<UserFormData>({
        resolver: zodResolver(userSchema) as any,
        defaultValues: user ? {
            username: user.username,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            password: '',
        } : {
            username: '',
            email: '',
            role: UserRole.EMPLOYEE,
            is_active: true,
            password: '',
        },
    });

    const handleSubmit = (values: UserFormData) => {
        if (user) {
            // Update
            const updateData: UserUpdate = {
                username: values.username,
                email: values.email,
                role: values.role,
                is_active: values.is_active,
            };
            onSubmit(updateData);
        } else {
            // Create
            if (!values.password) {
                form.setError('password', { message: 'Password is required for new users' });
                return;
            }
            const createData: UserCreate = {
                username: values.username,
                email: values.email,
                password: values.password,
                role: values.role,
            };
            onSubmit(createData);
        }
    };

    return (
        <Form {...(form as any)}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="john_doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="john@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {!user && (
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input placeholder="********" type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                                    <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                                    <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                                    <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : user ? 'Update User' : 'Create User'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
