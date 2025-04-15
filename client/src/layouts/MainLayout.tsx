import React, { useState } from 'react';
import { useLocation } from 'wouter';
import Sidebar from '@/components/sidebar/Sidebar';
import UserRoleSelector from '@/components/auth/UserRoleSelector';
import { Search, Bell, Settings, HelpCircle, Menu, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Application version - update this when making changes
export const APP_VERSION = "1.02";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile by default */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block md:flex-shrink-0 z-20`}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex h-16 bg-white border-b border-gray-200 z-10">
          <button 
            onClick={toggleMobileSidebar}
            className="md:hidden px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Search bar */}
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <div className="w-full max-w-lg lg:max-w-xs relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  className="block w-full pl-10 pr-3 py-2"
                  placeholder="Search contacts, deals, tasks..."
                  type="search"
                />
              </div>
            </div>
            
            {/* Right side buttons */}
            <div className="ml-4 flex items-center md:ml-6">
              {/* User Role Selector */}
              <div className="mr-4">
                <UserRoleSelector />
              </div>
              
              {/* Version indicator */}
              <div className="mr-4 flex items-center">
                <Badge variant="outline" className="bg-gray-50 text-gray-700 flex items-center gap-1 border-gray-200">
                  <Tag className="h-3 w-3" />
                  <span>v{APP_VERSION}</span>
                </Badge>
              </div>
              
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                <Bell className="h-5 w-5" />
              </button>
              <button className="ml-3 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                <Settings className="h-5 w-5" />
              </button>
              <button className="ml-3 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
