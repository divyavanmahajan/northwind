import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
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
  const { sidebarOpen } = useUIStore();

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(item.roles)
  );

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 border-r bg-card min-h-screen">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-emerald-500">
          Northwind
        </h1>
        <p className="text-xs text-muted-foreground capitalize mt-1">
          {user?.role} - {user?.username}
        </p>
      </div>

      <nav className="p-2 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
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
