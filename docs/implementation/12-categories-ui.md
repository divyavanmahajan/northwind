# Prompt 12: Categories UI Components

## Context
With the Categories backend complete, we now build the frontend components for displaying and managing categories, establishing patterns for all entity UIs.

## Prerequisites
- Completed Prompt 11 (Categories CRUD Backend)
- Frontend scaffold with auth working

## Goals
1. Create categories API service
2. Build reusable DataTable component
3. Implement categories list page
4. Create category form with validation
5. Add create/edit/delete functionality
6. Write frontend tests

---

## Prompt

```text
Build the Categories UI components including list, forms, and CRUD operations.

CATEGORY TYPES (src/types/category.ts):
Define category types:

```typescript
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
```

CATEGORY SERVICE (src/services/categoryService.ts):
Create API service:

```typescript
import api from '@/lib/api';
import { Category, CategoryCreate, CategoryUpdate } from '@/types/category';
import { PaginatedResponse } from '@/types/api';

const BASE_URL = '/categories';

export interface CategoryListParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const categoryService = {
  async getList(params: CategoryListParams = {}): Promise<PaginatedResponse<Category>> {
    const response = await api.get<PaginatedResponse<Category>>(BASE_URL, { params });
    return response.data;
  },

  async getById(id: number): Promise<Category> {
    const response = await api.get<Category>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(data: CategoryCreate): Promise<Category> {
    const response = await api.post<Category>(BASE_URL, data);
    return response.data;
  },

  async update(id: number, data: CategoryUpdate): Promise<Category> {
    const response = await api.put<Category>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
```

CATEGORY HOOKS (src/hooks/useCategories.ts):
Create React Query hooks:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService, CategoryListParams } from '@/services/categoryService';
import { CategoryCreate, CategoryUpdate } from '@/types/category';
import { toast } from 'sonner';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: CategoryListParams) => [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

export function useCategories(params: CategoryListParams = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoryService.getList(params),
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryCreate) => categoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success('Category created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create category');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdate }) =>
      categoryService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      toast.success('Category updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update category');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete category');
    },
  });
}
```

REUSABLE DATA TABLE (src/components/common/DataTable.tsx):
Create reusable table component:

```typescript
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
import { useState, useMemo } from 'react';

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
    if (sortBy !== column) return <ChevronsUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)} className={column.className}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(String(column.key))}
                      className="-ml-4 h-8"
                    >
                      {column.header}
                      <SortIcon column={String(column.key)} />
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
              {actions && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted' : ''}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className={column.className}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key] ?? '')}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
```

PAGINATION COMPONENT (src/components/common/Pagination.tsx):
```typescript
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {start} to {end} of {totalItems} results
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

CATEGORY FORM (src/components/features/categories/CategoryForm.tsx):
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Category, CategoryCreate } from '@/types/category';

const categorySchema = z.object({
  category_name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      category_name: category?.category_name || '',
      description: category?.description || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category_name">Category Name *</Label>
        <Input
          id="category_name"
          {...register('category_name')}
          placeholder="Enter category name"
          disabled={isLoading}
        />
        {errors.category_name && (
          <p className="text-sm text-destructive">{errors.category_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter description"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : category ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
```

CATEGORIES PAGE (src/pages/Categories.tsx):
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { CategoryForm } from '@/components/features/categories/CategoryForm';
import { RoleGate } from '@/components/auth/RoleGate';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Category } from '@/types/category';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

export function Categories() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('category_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const { data, isLoading } = useCategories({
    page,
    page_size: pageSize,
    search: search || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, 300);

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleCreate = async (formData: any) => {
    await createMutation.mutateAsync(formData);
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteCategory) {
      await deleteMutation.mutateAsync(deleteCategory.category_id);
      setDeleteCategory(null);
    }
  };

  const columns = [
    { key: 'category_id', header: 'ID', sortable: true },
    { key: 'category_name', header: 'Name', sortable: true },
    { key: 'description', header: 'Description' },
    { key: 'product_count', header: 'Products' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <RoleGate roles={['admin', 'manager']}>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </RoleGate>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        isLoading={isLoading}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearch={debouncedSearch}
        searchPlaceholder="Search categories..."
        onRowClick={(cat) => navigate(`/categories/${cat.category_id}`)}
        actions={(cat) => (
          <RoleGate roles={['admin', 'manager']}>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigate(`/categories/${cat.category_id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleteCategory(cat)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </RoleGate>
        )}
      />

      {data?.pagination && (
        <Pagination
          page={data.pagination.page}
          pageSize={data.pagination.page_size}
          totalItems={data.pagination.total_items}
          totalPages={data.pagination.total_pages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCategory?.category_name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

UPDATE ROUTING:
Update App.tsx to use the real Categories component:

```typescript
import { Categories } from '@/pages/Categories';
// Replace placeholder with real component
```

INSTALL DEBOUNCE:
npm install use-debounce

TESTS (src/__tests__/categories/):
```typescript
// Categories.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Categories } from '@/pages/Categories';
import { queryClient } from '@/lib/queryClient';

// Mock the service
jest.mock('@/services/categoryService', () => ({
  categoryService: {
    getList: jest.fn().mockResolvedValue({
      data: [
        { category_id: 1, category_name: 'Beverages', description: 'Drinks', product_count: 5 },
      ],
      pagination: { page: 1, page_size: 25, total_items: 1, total_pages: 1 },
    }),
  },
}));

describe('Categories Page', () => {
  it('renders categories list', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Categories />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Beverages')).toBeInTheDocument();
    });
  });
});
```

VERIFICATION:
1. docker-compose up -d
2. Login as admin
3. Navigate to /categories
4. Test search functionality
5. Test sorting by clicking headers
6. Test pagination
7. Create a new category
8. Edit the category
9. Delete the category
10. Run tests: cd frontend && npm test

SUCCESS CRITERIA:
- Categories list displays data
- Search filters in real-time (debounced)
- Sorting works on columns
- Pagination navigates correctly
- Create form validates and saves
- Edit updates category
- Delete confirms and removes
- All tests pass
```

---

## Verification Checklist

- [ ] Category types defined
- [ ] Category service makes API calls
- [ ] React Query hooks work
- [ ] DataTable component is reusable
- [ ] Pagination component works
- [ ] Category form validates
- [ ] List page shows data
- [ ] Search filters results
- [ ] Sorting changes order
- [ ] Create dialog works
- [ ] Delete confirmation works
- [ ] Role-based buttons show/hide
- [ ] Tests pass

---

## Next Step
Proceed to [Prompt 13: Suppliers CRUD (Backend)](./13-suppliers-crud.md)
