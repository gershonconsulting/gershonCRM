import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Plus } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/activity/ActivityFeed';
import PipelineView from '@/components/pipeline/PipelineView';
import { Button } from '@/components/ui/button';
import DealForm from '@/components/deals/DealForm';
import ContactForm from '@/components/contacts/ContactForm';

const Dashboard: React.FC = () => {
  const [isDealFormOpen, setIsDealFormOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
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
            <Button 
              onClick={() => setIsDealFormOpen(true)}
              className="ml-3"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
            <Button 
              onClick={() => setIsContactFormOpen(true)}
              variant="secondary"
              className="ml-3"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              New Contact
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="mt-8 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg h-32 animate-pulse">
                <div className="px-4 py-5 sm:p-6">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Active Deals" 
              value={stats?.activeDeals || 0} 
              change={12.5} 
            />
            <StatCard 
              title="Pipeline Value" 
              value={formatCurrency(stats?.pipelineValue || 0)} 
              change={8.2} 
            />
            <StatCard 
              title="Win Rate" 
              value={`${stats?.winRate || 0}%`} 
              change={-3.1} 
            />
            <StatCard 
              title="New Contacts" 
              value={stats?.newContacts || 0} 
              change={24.7} 
            />
          </div>
        )}

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
