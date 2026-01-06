import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailableManagers } from '@/hooks/useEmployees';
import type { EmployeeFormData, Employee } from '@/types/employee';

const employeeSchema = z.object({
    last_name: z.string().min(1, 'Last name is required').max(20),
    first_name: z.string().min(1, 'First name is required').max(10),
    title: z.string().max(30).optional(),
    title_of_courtesy: z.string().max(25).optional(),
    birth_date: z.string().optional().nullable(),
    hire_date: z.string().optional().nullable(),
    address: z.string().max(60).optional(),
    city: z.string().max(15).optional(),
    region: z.string().max(15).optional(),
    postal_code: z.string().max(10).optional(),
    country: z.string().max(15).optional(),
    home_phone: z.string().max(24).optional(),
    extension: z.string().max(4).optional(),
    notes: z.string().optional(),
    reports_to: z.string().optional().nullable(),
    photo_path: z.string().max(255).optional(),
});

interface EmployeeFormProps {
    initialData?: Employee;
    onSubmit: (data: EmployeeFormData) => void;
    isLoading?: boolean;
}

export function EmployeeForm({ initialData, onSubmit, isLoading }: EmployeeFormProps) {
    const form = useForm<z.infer<typeof employeeSchema>>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            last_name: initialData?.last_name || '',
            first_name: initialData?.first_name || '',
            title: initialData?.title || '',
            title_of_courtesy: initialData?.title_of_courtesy || '',
            birth_date: initialData?.birth_date ? new Date(initialData.birth_date).toISOString().split('T')[0] : '',
            hire_date: initialData?.hire_date ? new Date(initialData.hire_date).toISOString().split('T')[0] : '',
            address: initialData?.address || '',
            city: initialData?.city || '',
            region: initialData?.region || '',
            postal_code: initialData?.postal_code || '',
            country: initialData?.country || '',
            home_phone: initialData?.home_phone || '',
            extension: initialData?.extension || '',
            notes: initialData?.notes || '',
            reports_to: initialData?.reports_to !== undefined && initialData?.reports_to !== null ? initialData.reports_to.toString() : 'none',
            photo_path: initialData?.photo_path || '',
        },
    });

    const { data: managers } = useAvailableManagers(initialData?.employee_id);

    const handleSubmit = (values: z.infer<typeof employeeSchema>) => {
        const reports_to = values.reports_to === 'none' || !values.reports_to ? null : parseInt(values.reports_to);

        onSubmit({
            ...values,
            reports_to,
            birth_date: values.birth_date || null,
            hire_date: values.hire_date || null,
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="reports_to"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reports To</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a manager" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">No Manager (Top Level)</SelectItem>
                                        {managers?.map((mgr) => (
                                            <SelectItem key={mgr.employee_id} value={mgr.employee_id.toString()}>
                                                {mgr.first_name} {mgr.last_name} - {mgr.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="birth_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Birth Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="hire_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hire Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Employee'}
                </Button>
            </form>
        </Form>
    );
}
