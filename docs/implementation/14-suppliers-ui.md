# Prompt 14: Suppliers UI Components

## Context
Build the Suppliers frontend components following Categories patterns with additional filter dropdowns.

## Prerequisites
- Completed Prompt 13 (Suppliers CRUD Backend)

## Goals
1. Create supplier types and service
2. Build supplier list with filters
3. Implement supplier form
4. Add filter dropdowns for country/city
5. Create supplier detail view

---

## Prompt

```text
Implement the Suppliers UI components with advanced filtering capabilities.

SUPPLIER TYPES (src/types/supplier.ts):
```typescript
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

export interface SupplierUpdate extends Partial<SupplierCreate> {}
```

SUPPLIER SERVICE (src/services/supplierService.ts):
```typescript
import api from '@/lib/api';
import { Supplier, SupplierCreate, SupplierUpdate } from '@/types/supplier';
import { PaginatedResponse } from '@/types/api';

const BASE_URL = '/suppliers';

export interface SupplierListParams {
  page?: number;
  page_size?: number;
  search?: string;
  country?: string;
  city?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const supplierService = {
  async getList(params: SupplierListParams = {}): Promise<PaginatedResponse<Supplier>> {
    const response = await api.get<PaginatedResponse<Supplier>>(BASE_URL, { params });
    return response.data;
  },

  async getById(id: number): Promise<Supplier> {
    const response = await api.get<Supplier>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(data: SupplierCreate): Promise<Supplier> {
    const response = await api.post<Supplier>(BASE_URL, data);
    return response.data;
  },

  async update(id: number, data: SupplierUpdate): Promise<Supplier> {
    const response = await api.put<Supplier>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  async getCountries(): Promise<string[]> {
    const response = await api.get<string[]>(`${BASE_URL}/filters/countries`);
    return response.data;
  },

  async getCities(country?: string): Promise<string[]> {
    const params = country ? { country } : {};
    const response = await api.get<string[]>(`${BASE_URL}/filters/cities`, { params });
    return response.data;
  },
};
```

SUPPLIER HOOKS (src/hooks/useSuppliers.ts):
Create React Query hooks with filter data:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService, SupplierListParams } from '@/services/supplierService';

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (params: SupplierListParams) => [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: number) => [...supplierKeys.details(), id] as const,
  filters: () => [...supplierKeys.all, 'filters'] as const,
  countries: () => [...supplierKeys.filters(), 'countries'] as const,
  cities: (country?: string) => [...supplierKeys.filters(), 'cities', country] as const,
};

export function useSuppliers(params: SupplierListParams = {}) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => supplierService.getList(params),
  });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierService.getById(id),
    enabled: !!id,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: supplierKeys.countries(),
    queryFn: () => supplierService.getCountries(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCities(country?: string) {
  return useQuery({
    queryKey: supplierKeys.cities(country),
    queryFn: () => supplierService.getCities(country),
    staleTime: 1000 * 60 * 10,
  });
}

// Similar mutation hooks as categories...
```

FILTER PANEL COMPONENT (src/components/common/FilterPanel.tsx):
Create reusable filter panel:

```typescript
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterPanelProps {
  filters: Filter[];
  onClear: () => void;
}

export function FilterPanel({ filters, onClear }: FilterPanelProps) {
  const hasActiveFilters = filters.some((f) => f.value);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          <span className="text-sm font-medium">{filter.label}:</span>
          <Select value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={`All ${filter.label}s`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
```

SUPPLIER FORM (src/components/features/suppliers/SupplierForm.tsx):
Create form with all fields organized in sections:

```typescript
// Multi-section form with:
// - Company Information (name, homepage)
// - Contact Information (name, title, phone, fax)
// - Address (address, city, region, postal_code, country)
// Use a 2-column grid layout for better UX
```

SUPPLIERS PAGE (src/pages/Suppliers.tsx):
Build list page with filter panel:

```typescript
import { useState } from 'react';
import { useSuppliers, useCountries, useCities } from '@/hooks/useSuppliers';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { FilterPanel } from '@/components/common/FilterPanel';
// ... similar structure to Categories but with filters

export function Suppliers() {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  
  const { data: countries } = useCountries();
  const { data: cities } = useCities(country || undefined);
  
  // Reset city when country changes
  const handleCountryChange = (value: string) => {
    setCountry(value);
    setCity('');
  };
  
  const filters = [
    {
      key: 'country',
      label: 'Country',
      options: (countries || []).map(c => ({ value: c, label: c })),
      value: country,
      onChange: handleCountryChange,
    },
    {
      key: 'city',
      label: 'City',
      options: (cities || []).map(c => ({ value: c, label: c })),
      value: city,
      onChange: setCity,
    },
  ];
  
  // ... rest of component
}
```

SUPPLIER DETAIL PAGE (src/pages/SupplierDetail.tsx):
Create detail view showing:
- All supplier information in organized sections
- List of products from this supplier
- Edit/Delete actions based on role

UPDATE ROUTING:
Add routes for:
- /suppliers - list
- /suppliers/:id - detail
- /suppliers/:id/edit - edit form

TESTS:
Follow the Categories test patterns for Suppliers.

VERIFICATION:
1. Navigate to /suppliers
2. Test filter dropdowns (country should filter cities)
3. Test search
4. Create/edit/delete supplier
5. View supplier detail with products

SUCCESS CRITERIA:
- Supplier list displays with filters
- Country/city cascade filtering works
- All CRUD operations work
- Detail page shows supplier info
- Tests pass
```

---

## Next Step
Proceed to [Prompt 15: Products CRUD with Relationships (Backend)](./15-products-crud.md)
