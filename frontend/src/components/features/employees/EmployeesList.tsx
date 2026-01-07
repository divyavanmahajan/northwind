import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEmployees, useEmployeeMutations } from '@/hooks/useEmployees';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/user';
import { EmptyState } from '@/components/common/EmptyState';
import { AlertCircle, Edit, Trash2, Eye } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function EmployeesList() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

    const [searchParams, setSearchParams] = useSearchParams();

    // Parse filters from URL
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'last_name';
    const sortOrder = (searchParams.get('sort_order') || 'asc') as 'asc' | 'desc';
    const title = searchParams.get('title') || undefined;

    const { data: employees, isLoading, isError } = useEmployees({
        page,
        sort_by: sortBy,
        sort_order: sortOrder,
        search,
        title
    });

    const { deleteEmployee } = useEmployeeMutations();

    const updateParams = useCallback(
        (updates: Record<string, any>) => {
            const newParams = new URLSearchParams(searchParams);
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    newParams.set(key, String(value));
                } else {
                    newParams.delete(key);
                }
            });
            if (!updates.page) {
                newParams.set('page', '1');
            }
            setSearchParams(newParams);
        },
        [searchParams, setSearchParams]
    );

    const handleDelete = async (id: number) => {
        const promise = deleteEmployee.mutateAsync(id);

        toast.promise(promise, {
            loading: 'Deleting employee...',
            success: 'Employee deleted successfully',
            error: (err) => {
                const apiError = err.response?.data?.detail || err.message;
                return `Failed to delete employee: ${apiError}`;
            },
        });
    };

    const columns = [
        { key: 'employee_id', header: 'ID', sortable: true },
        {
            key: 'full_name',
            header: 'Name',
            sortable: false, // Sort is by last_name/first_name usually
            render: (emp: any) => `${emp.first_name} ${emp.last_name}`
        },
        { key: 'title', header: 'Title', sortable: true },
        { key: 'city', header: 'City', sortable: true },
        { key: 'country', header: 'Country', sortable: true },
        { key: 'reports_to_name', header: 'Reports To', sortable: false },
        {
            key: 'actions',
            header: 'Actions',
            render: (employee: any) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/employees/${employee.employee_id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {isAdminOrManager && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/employees/${employee.employee_id}/edit`)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will soft-delete the employee.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(employee.employee_id)}
                                            className="bg-destructive text-destructive-foreground"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            ),
        },
    ];

    if (isError) {
        return (
            <EmptyState
                title="Error loading employees"
                description="We encountered an issue while fetching the employee list."
                icon={AlertCircle}
                action={{ label: "Retry", onClick: () => window.location.reload() }}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => updateParams({ search: e.target.value })}
                        className="max-w-sm"
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={employees?.data || []}
                isLoading={isLoading}
                onSort={(key, order) => {
                    // map full_name sort to last_name for backend simplicity or disabling it
                    if (key === 'full_name') key = 'last_name';
                    updateParams({ sort_by: key, sort_order: order });
                }}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onRowClick={(emp) => navigate(`/employees/${emp.employee_id}`)}
            />

            {employees?.pagination && (
                <Pagination
                    page={employees.pagination.page}
                    pageSize={employees.pagination.page_size}
                    totalItems={employees.pagination.total_items}
                    totalPages={employees.pagination.total_pages}
                    onPageChange={(newPage) => updateParams({ page: newPage })}
                    onPageSizeChange={(newSize) => updateParams({ page_size: newSize, page: 1 })}
                />
            )}
        </div>
    );
}
