export interface SalesMetric {
    total_orders: number;
    total_revenue: string;
    average_order_value: string;
    orders_change_percent: number;
    revenue_change_percent: number;
}

export interface TopProduct {
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: string;
}

export interface TopCustomer {
    customer_id: string;
    company_name: string;
    total_orders: number;
    total_revenue: string;
}

export interface LowStockProduct {
    product_id: number;
    product_name: string;
    units_in_stock: number;
    reorder_level: number;
}

export interface OrdersByStatus {
    status: string;
    count: number;
}

export interface RevenueByPeriod {
    period: string;
    revenue: string;
    order_count: number;
}

export interface UserStats {
    total_users: number;
    active_users: number;
    new_users_this_period: number;
}

export interface AdminDashboardData {
    sales_overview: SalesMetric;
    revenue_trend: RevenueByPeriod[];
    orders_by_status: OrdersByStatus[];
    top_products: TopProduct[];
    top_customers: TopCustomer[];
    low_stock_alerts: LowStockProduct[];
    user_stats: UserStats;
}

export interface ManagerDashboardData {
    sales_overview: SalesMetric;
    revenue_trend: RevenueByPeriod[];
    orders_by_status: OrdersByStatus[];
    top_products: TopProduct[];
    low_stock_alerts: LowStockProduct[];
}

export interface EmployeeDashboardData {
    my_orders_count: number;
    my_orders_revenue: string;
    recent_orders: Array<{
        order_id: number;
        customer_name: string;
        order_date: string;
        total: string;
        status: string;
    }>;
}

export interface CustomerDashboardData {
    my_orders_count: number;
    my_total_spent: string;
    my_average_order: string;
    my_recent_orders: Array<{
        order_id: number;
        order_date: string;
        total: string;
        status: string;
    }>;
    my_favorite_products: Array<{
        product_name: string;
        times_ordered: number;
    }>;
}
