# Prompt 26: User Management (Admin)

## Context
Completing Phase 5, we implement user management functionality for administrators.

## Prerequisites
- Completed Prompt 25 (Dashboard UI)
- Auth system fully functional

## Goals
1. Create user management endpoints
2. Build user list with filtering
3. Implement user create/edit forms
4. Add user activation/deactivation
5. Implement password reset functionality

---

## Prompt

```text
Implement user management functionality for administrators.

USER MANAGEMENT ROUTER (backend/app/routers/users.py):
```python
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.auth.dependencies import require_roles
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, 
    UserListResponse, PasswordReset
)
from app.schemas.common import PaginatedResponse, PaginationInfo, MessageResponse
from app.services.user_service import UserService
from math import ceil

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=PaginatedResponse[UserListResponse])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """List all users with filtering. Admin only."""
    service = UserService(db)
    users, total = service.get_list(
        page=page, page_size=page_size,
        search=search, role=role, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order
    )
    
    return PaginatedResponse(
        data=[UserListResponse.model_validate(u) for u in users],
        pagination=PaginationInfo(
            page=page, page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total > 0 else 1,
            has_next=page * page_size < total,
            has_previous=page > 1
        )
    )

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Get a single user by ID."""
    service = UserService(db)
    user = service.get_by_id(user_id)
    if not user:
        raise NotFoundError(f"User {user_id} not found")
    return UserResponse.model_validate(user)

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Create a new user. Admin only."""
    service = UserService(db)
    user = service.create(data)
    return UserResponse.model_validate(user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Update user. Admin only."""
    service = UserService(db)
    user = service.update(user_id, data)
    return UserResponse.model_validate(user)

@router.patch("/{user_id}/activate", response_model=MessageResponse)
def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Activate a user account."""
    service = UserService(db)
    service.set_active(user_id, True)
    return MessageResponse(message="User activated successfully")

@router.patch("/{user_id}/deactivate", response_model=MessageResponse)
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Deactivate a user account."""
    if str(current_user.user_id) == user_id:
        raise ValidationError("Cannot deactivate your own account")
    service = UserService(db)
    service.set_active(user_id, False)
    return MessageResponse(message="User deactivated successfully")

@router.patch("/{user_id}/reset-password", response_model=MessageResponse)
def reset_user_password(
    user_id: str,
    data: PasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Reset user password. Admin only."""
    service = UserService(db)
    service.reset_password(user_id, data.new_password)
    return MessageResponse(message="Password reset successfully")

@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Delete a user. Admin only."""
    if str(current_user.user_id) == user_id:
        raise ValidationError("Cannot delete your own account")
    service = UserService(db)
    service.delete(user_id)
    return MessageResponse(message="User deleted successfully")
```

USER SCHEMAS:
```python
class UserListResponse(BaseModel):
    user_id: UUID
    username: str
    email: str
    role: UserRole
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=8)
```

USERS PAGE (src/pages/Users.tsx):
```typescript
export function Users() {
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: undefined as boolean | undefined,
  });
  
  const { data, isLoading } = useUsers(filters);
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();
  
  const columns = [
    { key: 'username', header: 'Username', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <Badge variant="outline" className="capitalize">
          {u.role}
        </Badge>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (u) => (
        <Badge variant={u.is_active ? 'default' : 'secondary'}>
          {u.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'last_login',
      header: 'Last Login',
      render: (u) => u.last_login ? formatDate(u.last_login) : 'Never'
    },
    { key: 'created_at', header: 'Created', sortable: true, render: (u) => formatDate(u.created_at) },
  ];
  
  const handleToggleActive = async (user: UserListItem) => {
    if (user.is_active) {
      await deactivateMutation.mutateAsync(user.user_id);
    } else {
      await activateMutation.mutateAsync(user.user_id);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="max-w-xs"
        />
        <Select
          value={filters.role}
          onValueChange={(value) => setFilters({ ...filters, role: value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.is_active?.toString() || ''}
          onValueChange={(value) => setFilters({ ...filters, is_active: value === '' ? undefined : value === 'true' })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <DataTable
        data={data?.data || []}
        columns={columns}
        isLoading={isLoading}
        actions={(user) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/users/${user.user_id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      
      {/* Create User Dialog */}
      {/* Edit User Dialog */}
      {/* Reset Password Dialog */}
    </div>
  );
}
```

USER FORM:
```typescript
const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'manager', 'employee', 'customer']),
});

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  // Form with username, email, role select, password (for create only)
}
```

TESTS:
- List, create, update, delete users
- Role filter, status filter, search
- Activate/deactivate toggle
- Password reset
- Cannot deactivate/delete self

VERIFICATION:
1. Login as admin
2. Navigate to /users
3. Create a new user
4. Edit a user
5. Toggle active status
6. Reset password

SUCCESS CRITERIA:
- User list with filtering
- CRUD operations work
- Activation toggle works
- Password reset works
- Cannot modify own account
```

---

## Next Step
Proceed to [Prompt 27: E2E Test Setup (Playwright)](./27-e2e-setup.md)

This begins **Phase 6: Polish, Testing & Deployment**.
