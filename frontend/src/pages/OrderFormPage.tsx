import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOrder, useUpdateOrder, useOrder } from '@/hooks/useOrders';
import { useCustomers } from '@/hooks/useCustomers';
import { useEmployees } from '@/hooks/useEmployees';
import { useProducts } from '@/hooks/useProducts';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import type { StartOrderDetail } from '@/types/order';
import { PageLoading } from '@/components/common/Skeletons';
import { toast } from 'sonner';

const orderSchema = z.object({
    customer_id: z.string().min(1, 'Customer is required'),
    employee_id: z.number().nullable().optional(),
    ship_name: z.string().optional(),
    ship_address: z.string().optional(),
    ship_city: z.string().optional(),
    ship_region: z.string().optional(),
    ship_postal_code: z.string().optional(),
    ship_country: z.string().optional(),
    freight: z.number().min(0).optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export function OrderFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;

    const { data: order } = useOrder(parseInt(id || '0'));
    const { data: customersData } = useCustomers({ page: 1, page_size: 100 });
    const { data: employeesData } = useEmployees({ page: 1, page_size: 100 });
    const { data: productsData } = useProducts({ page: 1, page_size: 100 });

    const createOrder = useCreateOrder();
    const updateOrder = useUpdateOrder();

    const [orderDetails, setOrderDetails] = useState<StartOrderDetail[]>([
        { product_id: 0, quantity: 1, discount: 0 },
    ]);

    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            customer_id: '',
            employee_id: null,
            freight: 0,
        }
    });

    // Populate form when data is loaded
    useEffect(() => {
        if (order) {
            reset({
                customer_id: order.customer?.customer_id,
                employee_id: order.employee?.employee_id || null,
                ship_name: order.ship_name || '',
                ship_address: order.ship_address || '',
                ship_city: order.ship_city || '',
                ship_region: order.ship_region || '',
                ship_postal_code: order.ship_postal_code || '',
                ship_country: order.ship_country || '',
                freight: Number(order.freight),
            });

            if (order.order_details && order.order_details.length > 0) {
                const details = order.order_details.map(d => ({
                    product_id: d.product_id,
                    quantity: d.quantity,
                    discount: Number(d.discount)
                }));
                setOrderDetails(details);
            }
        }
    }, [order, reset]);

    const onSubmit = async (data: OrderFormData) => {
        const payload = {
            ...data,
            order_details: orderDetails.filter(d => d.product_id > 0),
        };

        const promise = isEdit
            ? updateOrder.mutateAsync({ id: parseInt(id!), data: payload })
            : createOrder.mutateAsync(payload);

        toast.promise(promise, {
            loading: isEdit ? 'Updating order...' : 'Creating order...',
            success: () => {
                navigate('/orders');
                return `Order ${isEdit ? 'updated' : 'created'} successfully`;
            },
            error: (err) => {
                const apiError = err.response?.data?.detail || err.message;
                return `Failed to ${isEdit ? 'update' : 'create'} order: ${apiError}`;
            },
        });
    };

    if ((isEdit && !order) || !customersData || !employeesData || !productsData) return <PageLoading />;

    const addItem = () => {
        setOrderDetails([...orderDetails, { product_id: 0, quantity: 1, discount: 0 }]);
    };

    const removeItem = (index: number) => {
        setOrderDetails(orderDetails.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof StartOrderDetail, value: any) => {
        const updated = [...orderDetails];
        updated[index] = { ...updated[index], [field]: value };
        setOrderDetails(updated);
    };

    return (
        <div className="p-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate('/orders')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
            </Button>

            <h1 className="text-3xl font-bold">{isEdit ? 'Edit Order' : 'New Order'}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="customer_id">Customer *</Label>
                            <Select
                                value={watch('customer_id') || ''}
                                onValueChange={(v) => setValue('customer_id', v, { shouldValidate: true })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customersData?.data.map((c) => (
                                        <SelectItem key={c.customer_id} value={c.customer_id}>
                                            {c.company_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.customer_id && <p className="text-sm text-red-500">{errors.customer_id.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="employee_id">Employee</Label>
                            <Select
                                value={watch('employee_id') !== null && watch('employee_id') !== undefined ? watch('employee_id').toString() : 'UNASSIGNED'}
                                onValueChange={(v) => setValue('employee_id', (v === 'UNASSIGNED' || v === '') ? null : parseInt(v), { shouldValidate: true })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                                    {employeesData?.data.map((e) => (
                                        <SelectItem key={e.employee_id} value={e.employee_id.toString()}>
                                            {e.first_name} {e.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="freight">Freight</Label>
                            <Input type="number" step="0.01" {...register('freight', { valueAsNumber: true })} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {orderDetails.map((item, index) => (
                            <div key={index} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <Label>Product</Label>
                                    <Select
                                        value={item.product_id && item.product_id > 0 ? item.product_id.toString() : ''}
                                        onValueChange={(v) => updateItem(index, 'product_id', v ? parseInt(v) : 0)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {productsData?.data.map((p) => (
                                                <SelectItem key={p.product_id} value={p.product_id.toString()}>
                                                    {p.product_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-24">
                                    <Label>Qty</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="w-24">
                                    <Label>Discount %</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={item.discount * 100}
                                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) / 100)}
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addItem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="ship_name">Name</Label>
                            <Input {...register('ship_name')} />
                        </div>
                        <div>
                            <Label htmlFor="ship_address">Address</Label>
                            <Input {...register('ship_address')} />
                        </div>
                        <div>
                            <Label htmlFor="ship_city">City</Label>
                            <Input {...register('ship_city')} />
                        </div>
                        <div>
                            <Label htmlFor="ship_region">Region</Label>
                            <Input {...register('ship_region')} />
                        </div>
                        <div>
                            <Label htmlFor="ship_postal_code">Postal Code</Label>
                            <Input {...register('ship_postal_code')} />
                        </div>
                        <div>
                            <Label htmlFor="ship_country">Country</Label>
                            <Input {...register('ship_country')} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => navigate('/orders')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createOrder.isPending || updateOrder.isPending}>
                        {isEdit ? 'Update' : 'Create'} Order
                    </Button>
                </div>
            </form>
        </div>
    );
}
