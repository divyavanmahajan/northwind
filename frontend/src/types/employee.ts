export interface EmployeeStatistics {
    total_orders: number;
    orders_this_month: number;
    total_sales: number;
    average_order_value: number;
}

export interface ManagerInfo {
    employee_id: number;
    full_name: string;
    title: string | null;
}

export interface SubordinateInfo {
    employee_id: number;
    full_name: string;
    title: string | null;
}

export interface Employee {
    employee_id: number;
    last_name: string;
    first_name: string;
    title: string | null;
    title_of_courtesy: string | null;
    birth_date: string | null;
    hire_date: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
    home_phone: string | null;
    extension: string | null;
    notes: string | null;
    reports_to: number | null;
    photo_path: string | null;
    reports_to_name?: string | null;

    // Extended info
    manager?: ManagerInfo;
    subordinates?: SubordinateInfo[];
    statistics?: EmployeeStatistics;

    // Computed/Frontend helpers
    full_name?: string; // Often comes from backend or computed
}

export interface EmployeeFormData {
    last_name: string;
    first_name: string;
    title?: string;
    title_of_courtesy?: string;
    birth_date?: string | null;
    hire_date?: string | null;
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    home_phone?: string;
    extension?: string;
    notes?: string;
    reports_to?: number | null;
    photo_path?: string;
}

export interface OrgNode {
    employee_id: number;
    name: string;
    title: string | null;
    subordinates: OrgNode[];
}

import { PaginationParams } from './api';

export interface EmployeeFilterParams extends PaginationParams {
    search?: string;
    title?: string;
    city?: string;
    country?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
