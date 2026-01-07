import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
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
    DialogDescription,
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
import type { Category } from '@/types/category';
import { Plus, Pencil, Trash2, LayoutGrid } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

export function Categories() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('category_name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // States for Manage (Create/Edit)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // State for Delete
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const { data, isLoading } = useCategories({
        page,
        page_size: pageSize,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
    });

    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const debouncedSearch = useDebouncedCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, 300);

    const handleSort = (key: string, order: 'asc' | 'desc') => {
        setSortBy(key);
        setSortOrder(order);
    };

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (cat: Category) => {
        setEditingCategory(cat);
        setIsFormOpen(true);
    };

    const handleSubmit = async (formData: any) => {
        const promise = editingCategory
            ? updateMutation.mutateAsync({ id: editingCategory.category_id, data: formData })
            : createMutation.mutateAsync(formData);

        toast.promise(promise, {
            loading: editingCategory ? 'Updating category...' : 'Creating category...',
            success: (data) => {
                setIsFormOpen(false);
                return `Category "${data.category_name}" ${editingCategory ? 'updated' : 'created'} successfully`;
            },
            error: (err) => {
                const apiError = err.response?.data?.detail || err.message;
                return `Failed to ${editingCategory ? 'update' : 'create'} category: ${apiError}`;
            },
        });
    };

    const handleDelete = async () => {
        if (deletingCategory) {
            const promise = deleteMutation.mutateAsync(deletingCategory.category_id);

            toast.promise(promise, {
                loading: 'Deleting category...',
                success: () => {
                    setDeletingCategory(null);
                    return `Category "${deletingCategory.category_name}" deleted successfully`;
                },
                error: (err) => {
                    const apiError = err.response?.data?.detail || err.message;
                    return `Failed to delete category: ${apiError}`;
                },
            });
        }
    };

    const columns = useMemo(() => [
        {
            key: 'category_id',
            header: 'ID',
            sortable: true,
            className: "w-[80px]"
        },
        {
            key: 'category_name',
            header: 'Name',
            sortable: true,
            render: (cat: Category) => (
                <span className="font-semibold text-primary">{cat.category_name}</span>
            )
        },
        {
            key: 'description',
            header: 'Description',
            className: "max-w-[400px] truncate hidden md:table-cell",
            render: (cat: Category) => (
                <span className="text-muted-foreground">{cat.description || 'No description'}</span>
            )
        },
        {
            key: 'product_count',
            header: 'Products',
            className: "w-[120px] text-center",
            render: (cat: Category) => (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    {cat.product_count} products
                </div>
            )
        }
    ], []);

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="h-6 w-6 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage your product categories and descriptions.
                    </p>
                </div>

                <RoleGate roles={['admin', 'manager']}>
                    <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </RoleGate>
            </div>

            <div className="bg-card rounded-xl border shadow-sm">
                <DataTable
                    data={data?.data || []}
                    columns={columns}
                    isLoading={isLoading}
                    onSort={handleSort}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSearch={debouncedSearch}
                    searchPlaceholder="Search categories..."
                    onRowClick={(cat) => navigate(`/products?category_id=${cat.category_id}`)}
                    actions={(cat) => (
                        <RoleGate roles={['admin', 'manager']}>
                            <div className="flex justify-end gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEdit(cat);
                                    }}
                                    className="h-8 w-8 hover:text-primary"
                                    data-testid={`edit-category-${cat.category_id}`}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingCategory(cat);
                                    }}
                                    className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                                    data-testid={`delete-category-${cat.category_id}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </RoleGate>
                    )}
                />

                {data?.pagination && (
                    <div className="border-t px-4">
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
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? 'Update the category information below.'
                                : 'Fill in the details to create a new product category.'}
                        </DialogDescription>
                    </DialogHeader>
                    <CategoryForm
                        category={editingCategory || undefined}
                        onSubmit={handleSubmit}
                        onCancel={() => setIsFormOpen(false)}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{deletingCategory?.category_name}"</span>?
                            {deletingCategory && deletingCategory.product_count > 0 && (
                                <div className="mt-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20 font-medium">
                                    Warning: This category contains {deletingCategory.product_count} products.
                                    Deleting it will fail if restrictions are in place.
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Category'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
