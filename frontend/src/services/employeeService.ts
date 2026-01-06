import api from '@/lib/api';
import type { Employee, EmployeeFormData, EmployeeFilterParams, OrgNode } from '../types/employee';
import type { PaginatedResponse } from '../types/api';

const employeeService = {
    getAll: (params?: EmployeeFilterParams) =>
        api.get<PaginatedResponse<Employee>>('/employees', { params }),

    getById: (id: number) =>
        api.get<Employee>(`/employees/${id}`),

    create: (data: EmployeeFormData) =>
        api.post<Employee>('/employees', data),

    update: (id: number, data: EmployeeFormData) =>
        api.put<Employee>(`/employees/${id}`, data),

    delete: (id: number) =>
        api.delete<{ message: string }>(`/employees/${id}`),

    getTitles: () =>
        api.get<string[]>('/employees/filters/titles'),

    getOrgTree: () =>
        api.get<OrgNode[]>('/employees/org-tree'),

    getAvailableManagers: (excludeId?: number) =>
        api.get<Employee[]>('/employees/managers', { params: { exclude: excludeId } }),
};

export default employeeService;
