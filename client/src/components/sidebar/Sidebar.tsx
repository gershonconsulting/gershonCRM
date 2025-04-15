import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  PieChart, 
  Settings,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  HeartHandshake,
  Star,
  Clock,
  Shield
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole, useUserRole } from '@/hooks/use-user-role';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, closeMobileSidebar }) => {
  const [location] = useLocation();
  const [viewsOpen, setViewsOpen] = useState(false);
  const { isAdmin, role, username } = useUserRole();

  const mainMenu = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Views', path: '/views/by-fit', icon: <PieChart className="h-5 w-5" /> },
    { name: 'Reports', path: '/reports', icon: <PieChart className="h-5 w-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];
  
  // Admin menu item - only visible to admins
  const adminMenuItem = { 
    name: 'Admin', 
    path: '/adminpanel', 
    icon: <Shield className="h-5 w-5" />,
    requiredRole: UserRole.ADMIN
  };
  
  const viewsMenu = [
    { name: 'By Fit', path: '/views/by-fit', icon: <HeartHandshake className="h-5 w-5" /> },
    { name: 'By Interest', path: '/views/by-interest', icon: <Star className="h-5 w-5" /> },
    { name: 'By Week', path: '/views/by-week', icon: <Clock className="h-5 w-5" /> },
  ];

  const handleLinkClick = () => {
    // Close mobile sidebar on navigation
    closeMobileSidebar();
  };

  return (
    <div className={`flex flex-col ${isOpen ? 'w-64' : 'w-20'} border-r border-gray-200 bg-white h-full transition-width duration-300`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {isOpen ? (
          <span className="text-xl font-bold text-primary">Gershon CRM</span>
        ) : (
          <span className="text-xl font-bold text-primary mx-auto">GC</span>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none md:block hidden"
        >
          <ArrowLeft className={`h-5 w-5 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      <div className="flex flex-col flex-grow px-4 pt-5 pb-4 overflow-y-auto">
        <nav className="flex-1 space-y-1">
          {/* Main menu items */}
          {mainMenu.map((item) => {
            const isActive = location === item.path;
            return (
              <Link 
                key={item.path}
                href={item.path}
                onClick={handleLinkClick}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group
                  ${isActive 
                    ? 'text-white bg-primary' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <div className="mr-3">{item.icon}</div>
                {isOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
          
          {/* Admin menu item - only visible to admins */}
          {isAdmin && (
            <Link 
              key={adminMenuItem.path}
              href={adminMenuItem.path}
              onClick={handleLinkClick}
              className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group mt-2
                ${location === adminMenuItem.path
                  ? 'text-white bg-purple-600' 
                  : 'text-gray-600 hover:bg-purple-100 hover:text-purple-900'
                }`
              }
            >
              <div className="mr-3">{adminMenuItem.icon}</div>
              {isOpen && <span>{adminMenuItem.name}</span>}
            </Link>
          )}
          
          {/* Views dropdown remains hidden since we now have a main navigation item for it */}
        </nav>
      </div>
      
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar" />
            <AvatarFallback>{username ? username.substring(0, 2).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
          {isOpen && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">{username || 'User'}</p>
              <div className={`text-xs font-medium px-1.5 py-0.5 rounded-full inline-flex 
                ${role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                  role === UserRole.MANAGER ? 'bg-blue-100 text-blue-800' : 
                  'bg-green-100 text-green-800'}`}
              >
                {role || 'User'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
