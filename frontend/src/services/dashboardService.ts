import api from '@/lib/api';
import type { AdminDashboardData, ManagerDashboardData, EmployeeDashboardData, CustomerDashboardData } from '@/types/dashboard';

export const dashboardService = {
    async getAdminDashboard(period: string = '30d'): Promise<AdminDashboardData> {
        const response = await api.get('/dashboard/admin', { params: { period } });
        return response.data;
    },

    async getManagerDashboard(period: string = '30d'): Promise<ManagerDashboardData> {
        const response = await api.get('/dashboard/manager', { params: { period } });
        return response.data;
    },

    async getEmployeeDashboard(): Promise<EmployeeDashboardData> {
        const response = await api.get('/dashboard/employee');
        return response.data;
    },

    async getCustomerDashboard(period: string = '30d'): Promise<CustomerDashboardData> {
        const response = await api.get('/dashboard/customer', { params: { period } });
        return response.data;
    },
};
