export interface Category {
    category_id: number;
    category_name: string;
    description: string | null;
    product_count: number;
    created_at: string;
    updated_at: string;
}

export interface CategoryCreate {
    category_name: string;
    description?: string;
}

export interface CategoryUpdate {
    category_name?: string;
    description?: string;
}
