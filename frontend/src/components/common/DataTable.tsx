import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
    key: keyof T | string;
    header: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    isLoading?: boolean;
    onSort?: (key: string, order: 'asc' | 'desc') => void;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    onRowClick?: (item: T) => void;
    actions?: (item: T) => React.ReactNode;
    emptyMessage?: string;
    className?: string;
}

import { TableSkeleton } from './Skeletons';
import { EmptyState } from './EmptyState';

export function DataTable<T extends { [key: string]: any }>({
    data,
    columns,
    isLoading,
    onSort,
    sortBy,
    sortOrder,
    onSearch,
    searchPlaceholder = 'Search...',
    onRowClick,
    actions,
    emptyMessage = 'No data found',
    className,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSort = (key: string) => {
        if (!onSort) return;
        const newOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
        onSort(key, newOrder);
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortBy !== column) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 transition-opacity" />;
        return sortOrder === 'asc' ? (
            <ChevronUp className="ml-2 h-4 w-4 text-primary animate-in fade-in slide-in-from-bottom-1" />
        ) : (
            <ChevronDown className="ml-2 h-4 w-4 text-primary animate-in fade-in slide-in-from-top-1" />
        );
    };

    if (isLoading) {
        return (
            <div className={cn("space-y-4", className)}>
                {onSearch && (
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-full max-w-sm" />
                    </div>
                )}
                <TableSkeleton rows={8} columns={columns.length + (actions ? 1 : 0)} />
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {onSearch && (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9 transition-all focus:ring-primary/20"
                            aria-label={searchPlaceholder}
                        />
                    </div>
                </div>
            )}

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden transition-all duration-300">
                {data.length === 0 ? (
                    <EmptyState
                        title="No results found"
                        description={searchQuery ? `We couldn't find any matches for "${searchQuery}"` : emptyMessage}
                        className="border-none"
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                {columns.map((column) => (
                                    <TableHead key={String(column.key)} className={cn("font-semibold text-foreground py-3", column.className)}>
                                        {column.sortable ? (
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleSort(String(column.key))}
                                                className="-ml-4 h-8 hover:bg-transparent hover:text-primary transition-colors text-xs uppercase tracking-wider font-bold"
                                                aria-label={`Sort by ${column.header}`}
                                            >
                                                {column.header}
                                                <SortIcon column={String(column.key)} />
                                            </Button>
                                        ) : (
                                            <span className="text-xs uppercase tracking-wider font-bold opacity-70">
                                                {column.header}
                                            </span>
                                        )}
                                    </TableHead>
                                ))}
                                {actions && <TableHead className="w-[100px] text-right pr-4 text-xs uppercase tracking-wider font-bold opacity-70">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow
                                    key={index}
                                    onClick={() => onRowClick?.(item)}
                                    tabIndex={onRowClick ? 0 : undefined}
                                    onKeyDown={(e) => {
                                        if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            onRowClick(item);
                                        }
                                    }}
                                    className={cn(
                                        "group transition-all duration-200",
                                        onRowClick ? 'cursor-pointer hover:bg-muted/70 focus:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20' : ''
                                    )}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={String(column.key)} className={cn("py-4", column.className)}>
                                            {column.render
                                                ? column.render(item)
                                                : String(item[column.key] ?? '')}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                                {actions(item)}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
