import api from '@/lib/api';
import type { Employee, EmployeeFormData, EmployeeFilterParams, OrgNode } from '../types/employee';
import type { PaginatedResponse } from '../types/api';

const employeeService = {
    getAll: (params?: EmployeeFilterParams) =>
        api.get<PaginatedResponse<Employee>>('/employees', { params }).then(res => res.data),

    getById: (id: number) =>
        api.get<Employee>(`/employees/${id}`).then(res => res.data),

    create: (data: EmployeeFormData) =>
        api.post<Employee>('/employees', data).then(res => res.data),

    update: (id: number, data: EmployeeFormData) =>
        api.put<Employee>(`/employees/${id}`, data).then(res => res.data),

    delete: (id: number) =>
        api.delete<{ message: string }>(`/employees/${id}`).then(res => res.data),

    getTitles: () =>
        api.get<string[]>('/employees/filters/titles').then(res => res.data),

    getOrgTree: () =>
        api.get<OrgNode[]>('/employees/org-tree').then(res => res.data),

    getAvailableManagers: (excludeId?: number) =>
        api.get<Employee[]>('/employees/managers', { params: { exclude: excludeId } }).then(res => res.data),
};

export default employeeService;
