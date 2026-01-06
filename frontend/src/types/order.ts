import type { PaginationParams } from './api';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShipperInfo {
    shipper_id: number;
    company_name: string;
    phone?: string;
}

export interface CustomerInfo {
    customer_id: string;
    company_name: string;
    contact_name?: string;
}

export interface EmployeeInfo {
    employee_id: number;
    first_name: string;
    last_name: string;
}

export interface OrderDetail {
    product_id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
    discount: number;
    line_total: number;
    discount_amount: number;
    final_total: number;
}

export interface Order {
    order_id: number;
    customer_id?: string; // Backend sends object but list view might use flat
    employee_id?: number;

    // Relationships
    customer: CustomerInfo;
    employee?: EmployeeInfo;
    shipper?: ShipperInfo;

    order_date: string | null;
    required_date: string | null;
    shipped_date: string | null;
    ship_via: number | null;
    freight: number;
    ship_name: string | null;
    ship_address: string | null;
    ship_city: string | null;
    ship_region: string | null;
    ship_postal_code: string | null;
    ship_country: string | null;
    status: OrderStatus;

    subtotal: number;
    discount_total: number;
    total: number;

    order_details: OrderDetail[];
}

export interface OrderListResponse {
    order_id: number;
    customer?: CustomerInfo;
    employee?: EmployeeInfo;
    order_date: string | null;
    required_date: string | null;
    shipped_date: string | null;
    status: OrderStatus;
    total: number;
}

export interface StartOrderDetail {
    product_id: number;
    quantity: number;
    unit_price?: number; // Optional override
    discount: number;
}

export interface CreateOrderData {
    customer_id: string;
    employee_id?: number | null;
    order_date?: string | null;
    required_date?: string | null;
    ship_via?: number | null;
    freight?: number;
    ship_name?: string;
    ship_address?: string;
    ship_city?: string;
    ship_region?: string;
    ship_postal_code?: string;
    ship_country?: string;
    order_details: StartOrderDetail[];
}

export interface UpdateOrderData {
    order_date?: string | null;
    required_date?: string | null;
    shipped_date?: string | null;
    ship_via?: number | null;
    freight?: number;
    ship_name?: string;
    ship_address?: string;
    ship_city?: string;
    ship_region?: string;
    ship_postal_code?: string;
    ship_country?: string;
}

export interface OrderFilterParams extends PaginationParams {
    status?: OrderStatus;
    customer_id?: string;
    employee_id?: number;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
