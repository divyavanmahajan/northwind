export interface Product {
    product_id: number;
    product_name: string;
    supplier_id: number | null;
    category_id: number | null;
    quantity_per_unit: string | null;
    unit_price: number | null;
    units_in_stock: number | null;
    units_on_order: number | null;
    reorder_level: number | null;
    discontinued: boolean;
    stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
    category: {
        category_id: number;
        category_name: string;
    } | null;
    supplier: {
        supplier_id: number;
        company_name: string;
        contact_name: string | null;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface ProductListItem {
    product_id: number;
    product_name: string;
    category_name: string | null;
    supplier_name: string | null;
    unit_price: number | null;
    units_in_stock: number | null;
    stock_status: string;
    discontinued: boolean;
}

export interface ProductFilters {
    category_id?: number;
    supplier_id?: number;
    stock_status?: string;
    price_min?: number;
    price_max?: number;
    discontinued?: boolean;
}

export interface ProductListParams {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    category_id?: number;
    supplier_id?: number;
    stock_status?: string;
    price_min?: number;
    price_max?: number;
    discontinued?: boolean;
}

export interface ProductCreateInput {
    product_name: string;
    supplier_id?: number | null;
    category_id?: number | null;
    quantity_per_unit?: string | null;
    unit_price?: number | null;
    units_in_stock?: number | null;
    units_on_order?: number | null;
    reorder_level?: number | null;
    discontinued?: boolean;
}

export interface ProductUpdateInput {
    product_name?: string;
    supplier_id?: number | null;
    category_id?: number | null;
    quantity_per_unit?: string | null;
    unit_price?: number | null;
    units_in_stock?: number | null;
    units_on_order?: number | null;
    reorder_level?: number | null;
    discontinued?: boolean;
}
