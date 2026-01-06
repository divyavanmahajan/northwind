import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import type { OrderFilterParams, CreateOrderData, UpdateOrderData, OrderStatus } from '../types/order';

export function useOrders(params?: OrderFilterParams) {
    return useQuery({
        queryKey: ['orders', params],
        queryFn: () => orderService.getAll(params),
    });
}

export function useOrder(id: number) {
    return useQuery({
        queryKey: ['orders', id],
        queryFn: () => orderService.getById(id),
        enabled: !!id,
    });
}

export function useOrderStatuses() {
    return useQuery({
        queryKey: ['orders', 'statuses'],
        queryFn: () => orderService.getStatuses(),
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateOrderData) => orderService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

export function useUpdateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateOrderData }) =>
            orderService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders', variables.id] });
        },
    });
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) =>
            orderService.updateStatus(orderId, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
        },
    });
}

export function useDeleteOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => orderService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}
