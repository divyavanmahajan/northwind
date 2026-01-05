# Prompt 10: Protected Routes & Role-Based UI

## Context
Completing Phase 2, we implement frontend route protection and role-based UI rendering to match the backend authorization.

## Prerequisites
- Completed Prompt 09 (Frontend Auth Store & Login Page)
- Auth store working with login/logout

## Goals
1. Create ProtectedRoute component
2. Implement role-based route guards
3. Build role-aware UI components
4. Update navigation with auth state
5. Handle unauthorized access gracefully
6. Complete Phase 2 testing

---

## Prompt

```text
Implement protected routes and role-based UI components for the Northwind frontend.

PROTECTED ROUTE COMPONENT (src/components/auth/ProtectedRoute.tsx):
Create route guard component:

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  roles,
  permissions,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (roles && roles.length > 0 && !hasRole(roles)) {
    return fallback || <UnauthorizedPage />;
  }

  // Check permission requirements
  if (permissions && permissions.length > 0) {
    const hasRequired = permissions.some((p) => hasPermission(p));
    if (!hasRequired) {
      return fallback || <UnauthorizedPage />;
    }
  }

  return <>{children}</>;
}

function UnauthorizedPage() {
  const { user } = useAuth();
  
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
      <p className="mt-2 text-muted-foreground">
        Your role ({user?.role}) does not have access to this page.
      </p>
      <a href="/dashboard" className="mt-4 text-primary hover:underline">
        Go to Dashboard
      </a>
    </div>
  );
}
```

ROLE-BASED COMPONENTS (src/components/auth/RoleGate.tsx):
Create components for conditional rendering:

```typescript
import { useAuth } from '@/hooks/useAuth';

interface RoleGateProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
}

export function RoleGate({
  children,
  roles,
  permissions,
  fallback = null,
}: RoleGateProps) {
  const { hasRole, hasPermission } = useAuth();

  // Check roles
  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <>{fallback}</>;
  }

  // Check permissions
  if (permissions && permissions.length > 0) {
    const hasRequired = permissions.some((p) => hasPermission(p));
    if (!hasRequired) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Convenience components
export function AdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleGate roles={['admin']} fallback={fallback}>{children}</RoleGate>;
}

export function ManagerOrAdmin({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleGate roles={['admin', 'manager']} fallback={fallback}>{children}</RoleGate>;
}

export function CanEdit({ 
  entity, 
  children, 
  fallback = null 
}: { 
  entity: string;
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGate 
      permissions={[`${entity}:create`, `${entity}:update`]} 
      fallback={fallback}
    >
      {children}
    </RoleGate>
  );
}
```

UPDATE NAVIGATION (src/components/layout/Sidebar.tsx):
Add role-aware navigation:

```typescript
import { useAuth } from '@/hooks/useAuth';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Building2,
  Truck,
  UserCog,
  FolderTree,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Categories', href: '/categories', icon: FolderTree },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Customers', href: '/customers', icon: Building2, roles: ['admin', 'manager', 'employee'] },
  { label: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['admin', 'manager', 'employee'] },
  { label: 'Employees', href: '/employees', icon: Users, roles: ['admin', 'manager', 'employee'] },
  { label: 'Users', href: '/users', icon: UserCog, roles: ['admin'] },
];

export function Sidebar() {
  const { hasRole, user } = useAuth();
  
  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(item.roles)
  );

  return (
    <aside className="w-64 border-r bg-card">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Northwind</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {user?.role}
        </p>
      </div>
      
      <nav className="p-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
               ${isActive 
                 ? 'bg-primary text-primary-foreground' 
                 : 'text-muted-foreground hover:bg-muted hover:text-foreground'
               }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

UPDATE HEADER (src/components/layout/Header.tsx):
Add user menu with logout:

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Settings } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.username
    .split(/[._-]/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4">
      <div>
        {/* Breadcrumb or page title can go here */}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

UPDATE APP ROUTES (src/App.tsx):
Configure complete routing:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';

// Placeholder pages (to be implemented in later prompts)
const Products = () => <div>Products (Coming Soon)</div>;
const Categories = () => <div>Categories (Coming Soon)</div>;
const Orders = () => <div>Orders (Coming Soon)</div>;
const Customers = () => <div>Customers (Coming Soon)</div>;
const Suppliers = () => <div>Suppliers (Coming Soon)</div>;
const Employees = () => <div>Employees (Coming Soon)</div>;
const Users = () => <div>Users (Coming Soon)</div>;

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            
            <Route
              path="customers"
              element={
                <ProtectedRoute roles={['admin', 'manager', 'employee']}>
                  <Customers />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="suppliers"
              element={
                <ProtectedRoute roles={['admin', 'manager', 'employee']}>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="employees"
              element={
                <ProtectedRoute roles={['admin', 'manager', 'employee']}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

TESTS:

1. ProtectedRoute.test.tsx:
```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('redirects to login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows content when authenticated', () => {
    useAuthStore.setState({
      user: { user_id: '1', username: 'test', role: 'admin', is_active: true },
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows unauthorized for wrong role', () => {
    useAuthStore.setState({
      user: { user_id: '1', username: 'test', role: 'customer', is_active: true },
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });
});
```

2. RoleGate.test.tsx:
```typescript
import { render, screen } from '@testing-library/react';
import { RoleGate, AdminOnly } from '@/components/auth/RoleGate';
import { useAuthStore } from '@/store/authStore';

describe('RoleGate', () => {
  it('shows children when role matches', () => {
    useAuthStore.setState({
      user: { user_id: '1', username: 'admin', role: 'admin' },
      permissions: ['user:create'],
    });

    render(
      <RoleGate roles={['admin']}>
        <div>Admin Content</div>
      </RoleGate>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('shows fallback when role does not match', () => {
    useAuthStore.setState({
      user: { user_id: '1', username: 'user', role: 'customer' },
      permissions: [],
    });

    render(
      <AdminOnly fallback={<div>Not Admin</div>}>
        <div>Admin Content</div>
      </AdminOnly>
    );

    expect(screen.getByText('Not Admin')).toBeInTheDocument();
  });
});
```

VERIFICATION:
1. docker-compose up -d
2. Login as admin - should see all navigation items
3. Visit /users - should have access
4. Logout, login as customer - should see limited navigation
5. Try to visit /users directly - should see "Access Denied"
6. Run tests: cd frontend && npm test

SUCCESS CRITERIA:
- ProtectedRoute redirects unauthenticated users
- Role-based routes work correctly
- Navigation shows only accessible items
- User menu works with logout
- Unauthorized pages show appropriate message
- All tests pass
```

---

## Verification Checklist

- [ ] ProtectedRoute component works
- [ ] Role-based route guards function
- [ ] RoleGate conditionally renders content
- [ ] Navigation is role-aware
- [ ] User menu shows user info
- [ ] Logout clears state and redirects
- [ ] Unauthorized access handled gracefully
- [ ] All routes configured correctly
- [ ] All tests pass

---

## Phase 2 Complete!

Phase 2 (Authentication & Users) is now complete. The application has:
- Secure password handling with bcrypt
- JWT-based authentication
- Role-based access control
- Protected routes on frontend
- Role-aware UI components

---

## Next Step
Proceed to [Prompt 11: Categories CRUD (Backend)](./11-categories-crud.md)

This begins **Phase 3: Core Entities**.
