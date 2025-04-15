import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Plus, User, Settings } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/activity/ActivityFeed';
import PipelineView from '@/components/pipeline/PipelineView';
import { Button } from '@/components/ui/button';
import DealForm from '@/components/deals/DealForm';
import ContactForm from '@/components/contacts/ContactForm';
import UserRoleSelector from '@/components/auth/UserRoleSelector';
import { UserRole, useUserRole } from '@/hooks/use-user-role';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';

const Dashboard: React.FC = () => {
  const [isDealFormOpen, setIsDealFormOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  // Fetch dashboard stats
  const { data: stats = { newContacts: 0 }, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <RoleBasedAccess allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
              <Button 
                onClick={() => setIsDealFormOpen(true)}
                className="ml-3"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Deal
              </Button>
            </RoleBasedAccess>
            <RoleBasedAccess allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
              <Button 
                onClick={() => setIsContactFormOpen(true)}
                variant="secondary"
                className="ml-3"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                New Contact
              </Button>
            </RoleBasedAccess>
          </div>
        </div>

        {/* Role Selector */}
        <div className="mt-8">
          <div className="max-w-md">
            <UserRoleSelector />
          </div>
        </div>

        {/* Pipeline View */}
        <PipelineView onNewDeal={() => setIsDealFormOpen(true)} />

        {/* Recent Activity */}
        <div className="mt-8">
          <ActivityFeed limit={4} />
        </div>
      </div>

      {/* Deal Form Dialog */}
      <DealForm
        isOpen={isDealFormOpen}
        onOpenChange={setIsDealFormOpen}
      />

      {/* Contact Form Dialog */}
      <ContactForm
        isOpen={isContactFormOpen}
        onOpenChange={setIsContactFormOpen}
      />
    </MainLayout>
  );
};

export default Dashboard;
