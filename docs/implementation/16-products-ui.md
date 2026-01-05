# Prompt 16: Products UI with Search, Filter, Sort, Pagination

## Context
Build the Products frontend with comprehensive filtering, the most feature-rich list view in the application.

## Prerequisites
- Completed Prompt 15 (Products CRUD Backend)
- Categories and Suppliers UI available for selection

## Goals
1. Create products list with all filter options
2. Build advanced filter panel
3. Implement product form with relationship selects
4. Add stock status indicators
5. Create product detail page with related data

---

## Prompt

```text
Implement the Products UI with comprehensive filtering and relationship management.

PRODUCT TYPES (src/types/product.ts):
```typescript
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
```

PRODUCT HOOKS (src/hooks/useProducts.ts):
Create comprehensive hooks including filter helpers:

```typescript
export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productService.getList(params),
  });
}

// Hook for category dropdown
export function useCategoryOptions() {
  return useQuery({
    queryKey: ['categories', 'options'],
    queryFn: async () => {
      const response = await categoryService.getList({ page_size: 100 });
      return response.data.map(c => ({
        value: c.category_id,
        label: c.category_name,
      }));
    },
    staleTime: 1000 * 60 * 10,
  });
}

// Hook for supplier dropdown
export function useSupplierOptions() {
  return useQuery({
    queryKey: ['suppliers', 'options'],
    queryFn: async () => {
      const response = await supplierService.getList({ page_size: 100 });
      return response.data.map(s => ({
        value: s.supplier_id,
        label: s.company_name,
      }));
    },
    staleTime: 1000 * 60 * 10,
  });
}
```

STOCK STATUS BADGE (src/components/features/products/StockStatusBadge.tsx):
```typescript
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  in_stock: { label: 'In Stock', variant: 'default', className: 'bg-green-500' },
  low_stock: { label: 'Low Stock', variant: 'warning', className: 'bg-yellow-500' },
  out_of_stock: { label: 'Out of Stock', variant: 'destructive', className: 'bg-red-500' },
  discontinued: { label: 'Discontinued', variant: 'secondary', className: 'bg-gray-500' },
};

export function StockStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.in_stock;
  
  return (
    <Badge className={cn(config.className, 'text-white')}>
      {config.label}
    </Badge>
  );
}
```

PRODUCT FILTER PANEL (src/components/features/products/ProductFilterPanel.tsx):
Create advanced filter panel:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCategoryOptions, useSupplierOptions } from '@/hooks/useProducts';
import { ProductFilters } from '@/types/product';
import { Filter, X } from 'lucide-react';

interface ProductFilterPanelProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClear: () => void;
}

export function ProductFilterPanel({
  filters,
  onFiltersChange,
  onClear,
}: ProductFilterPanelProps) {
  const { data: categories } = useCategoryOptions();
  const { data: suppliers } = useSupplierOptions();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  const updateFilter = (key: keyof ProductFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {Object.values(filters).filter(v => v !== undefined).length}
            </span>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>
      
      {isExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={filters.category_id?.toString() || ''}
              onValueChange={(v) => updateFilter('category_id', v ? parseInt(v) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.value} value={c.value.toString()}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Supplier Filter */}
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={filters.supplier_id?.toString() || ''}
              onValueChange={(v) => updateFilter('supplier_id', v ? parseInt(v) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All suppliers</SelectItem>
                {suppliers?.map((s) => (
                  <SelectItem key={s.value} value={s.value.toString()}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Stock Status Filter */}
          <div className="space-y-2">
            <Label>Stock Status</Label>
            <Select
              value={filters.stock_status || ''}
              onValueChange={(v) => updateFilter('stock_status', v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Price Range */}
          <div className="space-y-2">
            <Label>Price Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.price_min || ''}
                onChange={(e) => updateFilter('price_min', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.price_max || ''}
                onChange={(e) => updateFilter('price_max', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>
          
          {/* Discontinued Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-discontinued"
              checked={filters.discontinued === true}
              onCheckedChange={(checked) => 
                updateFilter('discontinued', checked ? true : undefined)
              }
            />
            <Label htmlFor="show-discontinued">Show discontinued</Label>
          </div>
        </div>
      )}
    </div>
  );
}
```

PRODUCT FORM (src/components/features/products/ProductForm.tsx):
Form with category/supplier selects:

```typescript
// Include:
// - Product name input
// - Category select (from useCategoryOptions)
// - Supplier select (from useSupplierOptions)
// - Quantity per unit input
// - Unit price number input
// - Units in stock number input
// - Units on order number input
// - Reorder level number input
// - Discontinued checkbox
```

PRODUCTS PAGE (src/pages/Products.tsx):
Complete products list with all features:

```typescript
import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { ProductFilterPanel } from '@/components/features/products/ProductFilterPanel';
import { StockStatusBadge } from '@/components/features/products/StockStatusBadge';
import { formatCurrency } from '@/lib/utils';

// Use URL search params to persist filter state
export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Parse filters from URL
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const category_id = searchParams.get('category_id') 
    ? parseInt(searchParams.get('category_id')!) 
    : undefined;
  // ... more filter parsing
  
  // Update URL when filters change
  const updateFilters = useCallback((updates: Record<string, any>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);
  
  const columns = [
    { key: 'product_id', header: 'ID', sortable: true },
    { key: 'product_name', header: 'Product', sortable: true },
    { key: 'category_name', header: 'Category', sortable: true },
    { key: 'supplier_name', header: 'Supplier', sortable: true },
    { 
      key: 'unit_price', 
      header: 'Price', 
      sortable: true,
      render: (p) => formatCurrency(p.unit_price)
    },
    { key: 'units_in_stock', header: 'Stock', sortable: true },
    {
      key: 'stock_status',
      header: 'Status',
      render: (p) => <StockStatusBadge status={p.stock_status} />
    },
  ];
  
  // ... rest of component
}
```

PRODUCT DETAIL PAGE (src/pages/ProductDetail.tsx):
Show full product info with:
- All product fields in organized sections
- Category info (clickable link)
- Supplier info (clickable link)
- Stock status indicator
- Edit/Delete/Discontinue actions
- Recent orders containing this product (will be placeholder until Orders implemented)

UTILITY FUNCTIONS (src/lib/utils.ts):
Add currency formatting:

```typescript
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
```

UPDATE ROUTING:
- /products - list with URL-persisted filters
- /products/:id - detail
- /products/new - create form
- /products/:id/edit - edit form

TESTS:
Test filter URL synchronization, stock status badge, product form with selects.

VERIFICATION:
1. Test all filter combinations
2. Verify URL updates with filters
3. Share filtered URL - should restore state
4. Create product with category/supplier
5. View product detail
6. Discontinue product

SUCCESS CRITERIA:
- All filters work correctly
- URL persists filter state
- Stock status badges display correctly
- Category/supplier selects populated
- Product form validates
- Detail page shows all info
```

---

## Phase 3 Complete!

Phase 3 (Core Entities) is now complete:
- Categories with full CRUD
- Suppliers with address filtering
- Products with complex relationships and filtering

---

## Next Step
Proceed to [Prompt 17: Customers CRUD (Backend)](./17-customers-crud.md)

This begins **Phase 4: Business Entities**.
