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

    const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

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
                            {Object.values(filters).filter((v) => v !== undefined).length}
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
                            value={filters.category_id?.toString() || 'ALL'}
                            onValueChange={(v) => updateFilter('category_id', v === 'ALL' ? undefined : parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All categories</SelectItem>
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
                            value={filters.supplier_id?.toString() || 'ALL'}
                            onValueChange={(v) => updateFilter('supplier_id', v === 'ALL' ? undefined : parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All suppliers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All suppliers</SelectItem>
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
                            value={filters.stock_status || 'ALL'}
                            onValueChange={(v) => updateFilter('stock_status', v === 'ALL' ? undefined : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All statuses</SelectItem>
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
