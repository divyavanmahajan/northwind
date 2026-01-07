import { useState } from 'react';
import {
    useUsers,
    useCreateUser,
    useUpdateUser,
    useActivateUser,
    useDeactivateUser,
    useResetPassword,
    useDeleteUser
} from '@/hooks/useUsers';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    MoreVertical,
    Pencil,
    Key,
    UserX,
    UserCheck,
    Trash2,
    Search
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { UserForm } from '@/components/features/users/UserForm';
import { formatDate } from '@/lib/utils';
import { UserRole, type UserListItem } from '@/types/user';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export function Users() {
    const { user: currentUser } = useAuthStore();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading } = useUsers({
        page,
        page_size: pageSize,
        search: search || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        sort_by: sortBy,
        sort_order: sortOrder,
    });

    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const activateMutation = useActivateUser();
    const deactivateMutation = useDeactivateUser();
    const resetPasswordMutation = useResetPassword();
    const deleteMutation = useDeleteUser();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
    const [resettingUser, setResettingUser] = useState<UserListItem | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const handleCreateUser = async (values: any) => {
        const promise = createUserMutation.mutateAsync(values);
        toast.promise(promise, {
            loading: 'Creating user...',
            success: 'User created successfully',
            error: (err) => err.response?.data?.detail || 'Failed to create user',
        });
        try {
            await promise;
            setIsCreateDialogOpen(false);
        } catch (error) { }
    };

    const handleUpdateUser = async (values: any) => {
        if (!editingUser) return;
        const promise = updateUserMutation.mutateAsync({ id: editingUser.user_id, data: values });
        toast.promise(promise, {
            loading: 'Updating user...',
            success: 'User updated successfully',
            error: (err) => err.response?.data?.detail || 'Failed to update user',
        });
        try {
            await promise;
            setEditingUser(null);
        } catch (error) { }
    };

    const handleToggleActive = async (user: UserListItem) => {
        if (user.user_id === currentUser?.user_id) {
            toast.error('Cannot deactivate your own account');
            return;
        }
        const promise = user.is_active
            ? deactivateMutation.mutateAsync(user.user_id)
            : activateMutation.mutateAsync(user.user_id);

        toast.promise(promise, {
            loading: user.is_active ? 'Deactivating user...' : 'Activating user...',
            success: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
            error: (err) => err.response?.data?.detail || `Failed to ${user.is_active ? 'deactivate' : 'activate'} user`,
        });
    };

    const handleResetPassword = async () => {
        if (!resettingUser || !newPassword) return;
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        const promise = resetPasswordMutation.mutateAsync({
            id: resettingUser.user_id,
            data: { new_password: newPassword }
        });
        toast.promise(promise, {
            loading: 'Resetting password...',
            success: 'Password reset successfully',
            error: (err) => err.response?.data?.detail || 'Failed to reset password',
        });
        try {
            await promise;
            setResettingUser(null);
            setNewPassword('');
        } catch (error) { }
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        if (deletingUser.user_id === currentUser?.user_id) {
            toast.error('Cannot delete your own account');
            return;
        }
        const promise = deleteMutation.mutateAsync(deletingUser.user_id);
        toast.promise(promise, {
            loading: 'Deleting user...',
            success: 'User deleted successfully',
            error: (err) => err.response?.data?.detail || 'Failed to delete user',
        });
        try {
            await promise;
            setDeletingUser(null);
        } catch (error) { }
    };

    const columns = [
        { key: 'username', header: 'Username', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        {
            key: 'role',
            header: 'Role',
            sortable: true,
            render: (u: UserListItem) => (
                <Badge variant="outline" className="capitalize">
                    {u.role}
                </Badge>
            )
        },
        {
            key: 'is_active',
            header: 'Status',
            sortable: true,
            render: (u: UserListItem) => (
                <Badge variant={u.is_active ? 'default' : 'secondary'}>
                    {u.is_active ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            key: 'last_login',
            header: 'Last Login',
            sortable: true,
            render: (u: UserListItem) => u.last_login ? formatDate(u.last_login) : 'Never'
        },
        {
            key: 'created_at',
            header: 'Created',
            sortable: true,
            render: (u: UserListItem) => formatDate(u.created_at)
        },
        {
            key: 'actions',
            header: '',
            render: (user: UserListItem) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResettingUser(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                {user.is_active ? (
                                    <>
                                        <UserX className="mr-2 h-4 w-4" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Activate
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeletingUser(user)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">
                        Manage system users and their permissions.
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create User
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                            <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                            <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                            <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data?.data || []}
                isLoading={isLoading}
                onSort={(key, order) => {
                    setSortBy(key);
                    setSortOrder(order);
                }}
                sortBy={sortBy}
                sortOrder={sortOrder}
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Create a new user account with specific permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <UserForm
                        onSubmit={handleCreateUser}
                        onCancel={() => setIsCreateDialogOpen(false)}
                        isLoading={createUserMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <UserForm
                            user={editingUser}
                            onSubmit={handleUpdateUser}
                            onCancel={() => setEditingUser(null)}
                            isLoading={updateUserMutation.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={!!resettingUser} onOpenChange={(open) => !open && setResettingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Set a new password for {resettingUser?.username}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min 8 characters"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setResettingUser(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleResetPassword}
                                disabled={resetPasswordMutation.isPending || newPassword.length < 8}
                            >
                                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user account for {deletingUser?.username}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
