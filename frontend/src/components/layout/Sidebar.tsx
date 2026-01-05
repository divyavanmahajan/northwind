import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Sidebar = ({ className }: SidebarProps) => {
  const { sidebarOpen } = useUIStore();
  const location = useLocation();

  if (!sidebarOpen) return null;

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <div className={cn("pb-12 w-64 border-r min-h-screen bg-background", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    location.pathname === link.href ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {link.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
