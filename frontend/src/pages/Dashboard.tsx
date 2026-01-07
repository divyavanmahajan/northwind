import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { dashboardService } from '@/services/dashboardService';
import { AdminDashboard } from '@/components/features/dashboard/AdminDashboard';
import { ManagerDashboard } from '@/components/features/dashboard/ManagerDashboard';
import { EmployeeDashboard } from '@/components/features/dashboard/EmployeeDashboard';
import { CustomerDashboard } from '@/components/features/dashboard/CustomerDashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoading } from '@/components/common/Skeletons';
import { EmptyState } from '@/components/common/EmptyState';
import { AlertCircle } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');

  // Load appropriate dashboard based on role
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', user?.role, period],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!user.role) throw new Error('User role not assigned');

      switch (user.role) {
        case 'admin':
          return dashboardService.getAdminDashboard(period);
        case 'manager':
          return dashboardService.getManagerDashboard(period);
        case 'employee':
          return dashboardService.getEmployeeDashboard();
        case 'customer':
          return dashboardService.getCustomerDashboard(period);
        default:
          throw new Error(`Unsupported role: ${user.role}`);
      }
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <EmptyState
        title="Authentication required"
        description="Please log in to view your dashboard"
        action={{ label: "Login", onClick: () => window.location.href = "/login" }}
      />
    );
  }

  const renderContent = () => {
    if (dashboardQuery.isLoading) {
      return <PageLoading />;
    }

    if (dashboardQuery.isError) {
      return (
        <EmptyState
          title="Error loading dashboard"
          description="We couldn't load your dashboard data. This might be a temporary issue."
          icon={AlertCircle}
          action={{ label: "Try Again", onClick: () => dashboardQuery.refetch() }}
        />
      );
    }

    if (!dashboardQuery.data) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No dashboard data available</p>
        </div>
      );
    }

    switch (user.role) {
      case 'admin':
        return <AdminDashboard data={dashboardQuery.data as any} />;
      case 'manager':
        return <ManagerDashboard data={dashboardQuery.data as any} />;
      case 'employee':
        return <EmployeeDashboard data={dashboardQuery.data as any} />;
      case 'customer':
        return <CustomerDashboard data={dashboardQuery.data as any} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with period selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {user.role !== 'employee' && (
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {renderContent()}
    </div>
  );
};