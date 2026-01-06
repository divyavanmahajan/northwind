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
                            <SelectItem value="ALL">All</SelectItem>
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
