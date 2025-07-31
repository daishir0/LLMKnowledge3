import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './ui/sheet';
import {
  Home,
  Users,
  FileText,
  Database,
  Brain,
  Settings,
  LogOut,
  Menu,
  Grid3X3,
  CheckSquare,
  Shield,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Groups', href: '/groups', icon: Users },
    { name: 'Prompts', href: '/prompts', icon: FileText },
    { name: 'Records', href: '/records', icon: Database },
    { name: 'Knowledge', href: '/knowledge', icon: Brain },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Matrix', href: '/matrix', icon: Grid3X3 },
  ];

  if (user?.is_admin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-64'} bg-gray-900 text-white`}>
      <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
        <h1 className="text-xl font-bold">LLMKnowledge3</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden mr-2"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {location.pathname.slice(1) || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
