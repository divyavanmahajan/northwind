import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';
import type { CustomerFilters, CustomerFormData } from '@/types/customer';
import type { OrderListResponse } from '@/types/order';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import { toast } from 'sonner';

export const customerKeys = {
    all: ['customers'] as const,
    lists: () => [...customerKeys.all, 'list'] as const,
    list: (params: any) => [...customerKeys.lists(), params] as const,
    details: () => [...customerKeys.all, 'detail'] as const,
    detail: (id: string) => [...customerKeys.details(), id] as const,
    me: () => [...customerKeys.all, 'me'] as const,
};

export function useCustomers(params: PaginationParams & CustomerFilters & { sort_by?: string; sort_order?: string } = {}) {
    return useQuery({
        queryKey: customerKeys.list(params),
        queryFn: () => customerService.getList(params),
    });
}

export function useCustomer(id: string) {
    return useQuery({
        queryKey: customerKeys.detail(id),
        queryFn: () => customerService.getById(id),
        enabled: !!id,
    });
}

export function useCustomerMe() {
    return useQuery({
        queryKey: customerKeys.me(),
        queryFn: () => customerService.getMe(),
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CustomerFormData) => customerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            toast.success('Customer created successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to create customer'
            );
        },
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CustomerFormData> }) =>
            customerService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: customerKeys.me() });
            toast.success('Customer updated successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to update customer'
            );
        },
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => customerService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            toast.success('Customer deleted successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to delete customer'
            );
        },
    });
}

export function useCustomerCountries() {
    return useQuery({
        queryKey: ['customers', 'countries'],
        queryFn: () => customerService.getCountries(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useCustomerCities(country?: string) {
    return useQuery({
        queryKey: ['customers', 'cities', country],
        queryFn: () => customerService.getCities(country),
        enabled: true, // Always enabled, returns all cities if no country
        staleTime: 1000 * 60 * 60,
    });
}



export function useCustomerOrders(id: string, params: PaginationParams = {}) {
    return useQuery<PaginatedResponse<OrderListResponse>>({
        queryKey: [...customerKeys.detail(id), 'orders', params],
        queryFn: async () => {
            return {
                data: [],
                pagination: {
                    page: 1,
                    page_size: params.page_size || 10,
                    total_items: 0,
                    total_pages: 0,
                    has_next: false,
                    has_previous: false
                }
            };
        },
        enabled: !!id,
    });
}
