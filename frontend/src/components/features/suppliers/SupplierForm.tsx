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
import { Card, CardContent } from '@/components/ui/card';
import type { SupplierCreate, Supplier } from '@/types/supplier';

const supplierSchema = z.object({
    company_name: z.string().min(1, 'Company name is required').max(100),
    contact_name: z.string().max(100).optional().or(z.literal('')),
    contact_title: z.string().max(50).optional().or(z.literal('')),
    address: z.string().max(200).optional().or(z.literal('')),
    city: z.string().max(50).optional().or(z.literal('')),
    region: z.string().max(50).optional().or(z.literal('')),
    postal_code: z.string().max(20).optional().or(z.literal('')),
    country: z.string().max(50).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    fax: z.string().max(30).optional().or(z.literal('')),
    homepage: z.string().optional().or(z.literal('')),
});

interface SupplierFormProps {
    initialData?: Supplier;
    onSubmit: (data: SupplierCreate) => void;
    isLoading?: boolean;
}

export function SupplierForm({ initialData, onSubmit, isLoading }: SupplierFormProps) {
    const form = useForm<z.infer<typeof supplierSchema>>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            company_name: initialData?.company_name || '',
            contact_name: initialData?.contact_name || '',
            contact_title: initialData?.contact_title || '',
            address: initialData?.address || '',
            city: initialData?.city || '',
            region: initialData?.region || '',
            postal_code: initialData?.postal_code || '',
            country: initialData?.country || '',
            phone: initialData?.phone || '',
            fax: initialData?.fax || '',
            homepage: initialData?.homepage || '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Info */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="text-lg font-medium">Company Information</h3>
                            <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Acme Corp" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="homepage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Homepage</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="text-lg font-medium">Contact Information</h3>
                            <FormField
                                control={form.control}
                                name="contact_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
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
                                            <Input placeholder="Sales Manager" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1-555-0100" {...field} />
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
                                                <Input placeholder="+1-555-0101" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Info */}
                    <Card className="md:col-span-2">
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="text-lg font-medium">Address Information</h3>
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Street Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Main St" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="London" {...field} />
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
                                                <Input placeholder="Greater London" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="postal_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Postal Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="EC1A 1BB" {...field} />
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
                                                <Input placeholder="UK" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : initialData ? 'Update Supplier' : 'Create Supplier'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
