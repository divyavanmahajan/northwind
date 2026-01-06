export interface CustomerStatistics {
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    first_order_date: string | null;
    last_order_date: string | null;
}

export interface Customer {
    customer_id: string;
    company_name: string;
    contact_name: string | null;
    contact_title: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
    phone: string | null;
    fax: string | null;
    user_id: string | null;
    statistics?: CustomerStatistics;
    order_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CustomerFormData {
    customer_id: string;
    company_name: string;
    contact_name?: string;
    contact_title?: string;
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    fax?: string;
    user_id?: string;
}

export interface CustomerFilters {
    search?: string;
    country?: string;
    city?: string;
}
