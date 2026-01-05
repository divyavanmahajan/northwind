# Prompt 25: Dashboard UI Components with Charts

## Context
Build role-specific dashboard pages with charts and data visualization.

## Prerequisites
- Completed Prompt 24 (Dashboard API)
- Chart.js installed

## Goals
1. Create reusable chart components
2. Build admin dashboard with all metrics
3. Build manager dashboard
4. Build employee dashboard
5. Build customer dashboard

---

## Prompt

```text
Implement dashboard UI with charts and role-specific content.

CHART COMPONENTS (src/components/common/charts/):

LINE CHART (LineChart.tsx):
```typescript
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
  title?: string;
}

export function LineChart({ labels, datasets, title }: LineChartProps) {
  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      ...ds,
      borderColor: ds.borderColor || `hsl(${i * 60}, 70%, 50%)`,
      backgroundColor: ds.backgroundColor || `hsla(${i * 60}, 70%, 50%, 0.1)`,
      tension: 0.3,
      fill: true,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: !!title, text: title },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return <Line data={data} options={options} />;
}
```

PIE CHART (PieChart.tsx):
```typescript
import { Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  labels: string[];
  data: number[];
  colors?: string[];
  title?: string;
  type?: 'pie' | 'doughnut';
}

export function PieChart({ labels, data, colors, title, type = 'doughnut' }: PieChartProps) {
  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: colors || [
        'hsl(210, 70%, 50%)',
        'hsl(160, 70%, 50%)',
        'hsl(40, 70%, 50%)',
        'hsl(0, 70%, 50%)',
        'hsl(280, 70%, 50%)',
      ],
    }],
  };

  const ChartComponent = type === 'pie' ? Pie : Doughnut;
  
  return <ChartComponent data={chartData} />;
}
```

BAR CHART (BarChart.tsx):
Similar pattern for bar charts.

STAT CARD (src/components/common/StatCard.tsx):
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export function StatCard({ title, value, icon: Icon, trend, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            "text-xs flex items-center",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {trend.value > 0 ? '+' : ''}{trend.value}% from last period
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

DASHBOARD SERVICE (src/services/dashboardService.ts):
```typescript
export const dashboardService = {
  async getAdminDashboard(period: string = '30d') {
    const response = await api.get(`/dashboard/admin`, { params: { period } });
    return response.data;
  },
  // Similar for manager, employee, customer...
};
```

DASHBOARD PAGE (src/pages/Dashboard.tsx):
Role-aware dashboard that loads appropriate content:

```typescript
export function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
  
  // Load appropriate dashboard based on role
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', user?.role, period],
    queryFn: () => {
      switch (user?.role) {
        case 'admin': return dashboardService.getAdminDashboard(period);
        case 'manager': return dashboardService.getManagerDashboard(period);
        case 'employee': return dashboardService.getEmployeeDashboard();
        case 'customer': return dashboardService.getCustomerDashboard(period);
        default: return null;
      }
    },
  });

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header with period selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {user.role !== 'employee' && (
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
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
      
      {/* Role-specific dashboard content */}
      {user.role === 'admin' && <AdminDashboard data={dashboardQuery.data} />}
      {user.role === 'manager' && <ManagerDashboard data={dashboardQuery.data} />}
      {user.role === 'employee' && <EmployeeDashboard data={dashboardQuery.data} />}
      {user.role === 'customer' && <CustomerDashboard data={dashboardQuery.data} />}
    </div>
  );
}
```

ADMIN DASHBOARD (src/components/features/dashboard/AdminDashboard.tsx):
```typescript
export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={data.sales_overview.total_orders}
          icon={ShoppingCart}
          trend={{
            value: data.sales_overview.orders_change_percent,
            isPositive: data.sales_overview.orders_change_percent > 0
          }}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(data.sales_overview.total_revenue)}
          icon={DollarSign}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(data.sales_overview.average_order_value)}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Users"
          value={data.user_stats.total_users}
          icon={Users}
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <LineChart
              labels={data.revenue_trend.map(r => r.period)}
              datasets={[{
                label: 'Revenue',
                data: data.revenue_trend.map(r => Number(r.revenue))
              }]}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="w-64 h-64">
              <PieChart
                labels={data.orders_by_status.map(s => s.status)}
                data={data.orders_by_status.map(s => s.count)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tables Row */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              {/* Top products table */}
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock Alerts</CardTitle>
            <Badge variant="destructive">{data.low_stock_alerts.length}</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              {/* Low stock table */}
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

Create similar components for:
- ManagerDashboard
- EmployeeDashboard  
- CustomerDashboard

VERIFICATION:
1. Login as each role
2. Verify appropriate dashboard loads
3. Charts render correctly
4. Period selector updates data
5. Stats match API data

SUCCESS CRITERIA:
- Each role sees appropriate dashboard
- Charts render and update
- Period selector works
- Stats display correctly
- Low stock alerts highlighted
```

---

## Next Step
Proceed to [Prompt 26: Detail Pages with Related Data](./26-detail-pages.md)
