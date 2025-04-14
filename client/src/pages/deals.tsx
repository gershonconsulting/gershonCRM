import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import PipelineView from '@/components/pipeline/PipelineView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DealForm from '@/components/deals/DealForm';
import { DealStage } from '@shared/schema';

const DealsPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fetch pipeline stages for filtering
  const { data: stages = [] } = useQuery<DealStage[]>({
    queryKey: ['/api/deal-stages'],
  });

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Deals
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 sm:items-center">
          <div className="relative max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search deals..."
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-3">
            <Select 
              value={selectedFilter}
              onValueChange={setSelectedFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id.toString()}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Pipeline View */}
        <div className="mt-6">
          <PipelineView onNewDeal={() => setIsFormOpen(true)} />
        </div>
      </div>

      {/* Deal Form Dialog */}
      <DealForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </MainLayout>
  );
};

export default DealsPage;
