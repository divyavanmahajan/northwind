export interface Supplier {
    supplier_id: number;
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
    homepage: string | null;
    product_count: number;
    created_at: string;
    updated_at: string;
}

export interface SupplierCreate {
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
    homepage?: string;
}

export interface SupplierUpdate extends Partial<SupplierCreate> { }
