import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import employeeService from '../services/employeeService';
import { EmployeeFilterParams, EmployeeFormData } from '../types/employee';

export const useEmployees = (params: EmployeeFilterParams) => {
    return useQuery({
        queryKey: ['employees', params],
        queryFn: () => employeeService.getAll(params),
    });
};

export const useEmployee = (id: number) => {
    return useQuery({
        queryKey: ['employee', id],
        queryFn: () => employeeService.getById(id),
        enabled: !!id,
    });
};

export const useEmployeeMutations = () => {
    const queryClient = useQueryClient();

    const createEmployee = useMutation({
        mutationFn: employeeService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee-org-tree'] });
        },
    });

    const updateEmployee = useMutation({
        mutationFn: ({ id, data }: { id: number; data: EmployeeFormData }) =>
            employeeService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['employee-org-tree'] });
        },
    });

    const deleteEmployee = useMutation({
        mutationFn: employeeService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee-org-tree'] });
        },
    });

    return { createEmployee, updateEmployee, deleteEmployee };
};

export const useEmployeeTitles = () => {
    return useQuery({
        queryKey: ['employee-titles'],
        queryFn: employeeService.getTitles,
    });
};

export const useOrgTree = () => {
    return useQuery({
        queryKey: ['employee-org-tree'],
        queryFn: employeeService.getOrgTree,
    });
};

export const useAvailableManagers = (excludeId?: number) => {
    return useQuery({
        queryKey: ['available-managers', excludeId],
        queryFn: () => employeeService.getAvailableManagers(excludeId),
    });
};
