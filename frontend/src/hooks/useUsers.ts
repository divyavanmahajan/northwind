import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { UserCreate, UserUpdate, PasswordReset } from '@/types/user';
import type { PaginationParams } from '@/types/api';
import { toast } from 'sonner';

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (params: any) => [...userKeys.lists(), params] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(params: PaginationParams & { search?: string; role?: string; is_active?: boolean; sort_by?: string; sort_order?: string } = {}) {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => userService.getList(params),
    });
}

export function useUser(id: string) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => userService.getById(id),
        enabled: !!id,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UserCreate) => userService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            toast.success('User created successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to create user'
            );
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
            userService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
            toast.success('User updated successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to update user'
            );
        },
    });
}

export function useActivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => userService.activate(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
            toast.success('User activated successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to activate user'
            );
        },
    });
}

export function useDeactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => userService.deactivate(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
            toast.success('User deactivated successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to deactivate user'
            );
        },
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: PasswordReset }) =>
            userService.resetPassword(id, data),
        onSuccess: () => {
            toast.success('Password reset successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to reset password'
            );
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => userService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            toast.success('User deleted successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message ||
                error.response?.data?.detail ||
                'Failed to delete user'
            );
        },
    });
}
