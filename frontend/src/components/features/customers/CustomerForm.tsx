import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Customer, CustomerFormData } from '@/types/customer';

const customerSchema = z.object({
    customer_id: z.string().min(1, 'Customer ID is required').max(5, 'Max 5 characters'),
    company_name: z.string().min(1, 'Company Name is required').max(100),
    contact_name: z.string().max(100).optional().or(z.literal('')),
    contact_title: z.string().max(50).optional().or(z.literal('')),
    address: z.string().max(200).optional().or(z.literal('')),
    city: z.string().max(50).optional().or(z.literal('')),
    region: z.string().max(50).optional().or(z.literal('')),
    postal_code: z.string().max(20).optional().or(z.literal('')),
    country: z.string().max(50).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    fax: z.string().max(30).optional().or(z.literal('')),
    user_id: z.string().uuid().optional().or(z.literal('')),
});

interface CustomerFormProps {
    customer?: Customer;
    onSubmit: (data: CustomerFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function CustomerForm({ customer, onSubmit, onCancel, isLoading }: CustomerFormProps) {
    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: customer ? {
            customer_id: customer.customer_id,
            company_name: customer.company_name,
            contact_name: customer.contact_name || '',
            contact_title: customer.contact_title || '',
            address: customer.address || '',
            city: customer.city || '',
            region: customer.region || '',
            postal_code: customer.postal_code || '',
            country: customer.country || '',
            phone: customer.phone || '',
            fax: customer.fax || '',
            user_id: customer.user_id || '',
        } : {
            customer_id: '',
            company_name: '',
            contact_name: '',
            contact_title: '',
            address: '',
            city: '',
            region: '',
            postal_code: '',
            country: '',
            phone: '',
            fax: '',
            user_id: '',
        },
    });

    const handleSubmit = (data: CustomerFormData) => {
        // Clean up empty strings to undefined/null if needed, but schema handles some.
        // Backend expects proper types. user_id '' should be null?
        const formattedData = {
            ...data,
            user_id: data.user_id === '' ? undefined : data.user_id
        };
        // @ts-ignore - fixing type mismatch for user_id optionality
        onSubmit(formattedData);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Customer ID</FormLabel>
                            <FormControl>
                                <Input placeholder="ALFKI" disabled={!!customer} {...field} maxLength={5} />
                            </FormControl>
                            <FormDescription>Unique 5-character identifier.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Company Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="contact_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Contact Name" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contact_title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Contact Title" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 border rounded-md p-4">
                    <h3 className="font-medium">Address</h3>
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Address" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                        <Input placeholder="City" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="region"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Region</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Region" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="postal_code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Postal Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Postal Code" {...field} value={field.value || ''} />
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
                                        <Input placeholder="Country" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="Phone" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fax"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fax</FormLabel>
                                <FormControl>
                                    <Input placeholder="Fax" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
