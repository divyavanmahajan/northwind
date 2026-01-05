import { useUIStore } from '@/store/uiStore';
import { Menu, Moon, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const { toggleSidebar, theme, setTheme } = useUIStore();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button variant="ghost" size="icon" className="mr-4" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block">Northwind</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search placeholder */}
          </div>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="sr-only">Toggle Theme</span>
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User Menu</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
