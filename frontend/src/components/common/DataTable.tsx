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
import { cn } from '@/lib/utils';

interface Column<T> {
    key: keyof T | string;
    header: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    onSort?: (key: string, order: 'asc' | 'desc') => void;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    onRowClick?: (item: T) => void;
    actions?: (item: T) => React.ReactNode;
    emptyMessage?: string;
}

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
        if (sortBy !== column) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
        return sortOrder === 'asc' ? (
            <ChevronUp className="ml-2 h-4 w-4" />
        ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
        );
    };

    return (
        <div className="space-y-4">
            {onSearch && (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            )}

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={String(column.key)} className={column.className}>
                                    {column.sortable ? (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleSort(String(column.key))}
                                            className="-ml-4 h-8 hover:bg-transparent"
                                        >
                                            {column.header}
                                            <SortIcon column={String(column.key)} />
                                        </Button>
                                    ) : (
                                        column.header
                                    )}
                                </TableHead>
                            ))}
                            {actions && <TableHead className="w-[100px] text-right pr-4">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <span className="text-sm text-muted-foreground">Loading data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10 text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow
                                    key={index}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        "transition-colors",
                                        onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
                                    )}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={String(column.key)} className={column.className}>
                                            {column.render
                                                ? column.render(item)
                                                : String(item[column.key] ?? '')}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                            {actions(item)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
