import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService, SupplierListParams } from '@/services/supplierService';
import { SupplierCreate, SupplierUpdate } from '@/types/supplier';

export const supplierKeys = {
    all: ['suppliers'] as const,
    lists: () => [...supplierKeys.all, 'list'] as const,
    list: (params: SupplierListParams) => [...supplierKeys.lists(), params] as const,
    details: () => [...supplierKeys.all, 'detail'] as const,
    detail: (id: number) => [...supplierKeys.details(), id] as const,
    filters: () => [...supplierKeys.all, 'filters'] as const,
    countries: () => [...supplierKeys.filters(), 'countries'] as const,
    cities: (country?: string) => [...supplierKeys.filters(), 'cities', country] as const,
};

export function useSuppliers(params: SupplierListParams = {}) {
    return useQuery({
        queryKey: supplierKeys.list(params),
        queryFn: () => supplierService.getList(params),
    });
}

export function useSupplier(id: number) {
    return useQuery({
        queryKey: supplierKeys.detail(id),
        queryFn: () => supplierService.getById(id),
        enabled: !!id,
    });
}

export function useCountries() {
    return useQuery({
        queryKey: supplierKeys.countries(),
        queryFn: () => supplierService.getCountries(),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useCities(country?: string) {
    return useQuery({
        queryKey: supplierKeys.cities(country),
        queryFn: () => supplierService.getCities(country),
        staleTime: 1000 * 60 * 10,
    });
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SupplierCreate) => supplierService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
            queryClient.invalidateQueries({ queryKey: supplierKeys.filters() });
        },
    });
}

export function useUpdateSupplier(id: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SupplierUpdate) => supplierService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
            queryClient.invalidateQueries({ queryKey: supplierKeys.filters() });
        },
    });
}

export function useDeleteSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => supplierService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
            queryClient.invalidateQueries({ queryKey: supplierKeys.filters() });
        },
    });
}
