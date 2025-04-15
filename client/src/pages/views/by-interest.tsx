import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DealWithContact } from '@shared/schema';
import MainLayout from '@/layouts/MainLayout';
import PipelineView from '@/components/pipeline/PipelineView';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ByInterestPage: React.FC = () => {
  const [selectedInterest, setSelectedInterest] = useState<string>('all');
  
  // Fetch all deals
  const { data: deals = [], isLoading } = useQuery<DealWithContact[]>({
    queryKey: ['/api/deals'],
  });
  
  // Use predefined interest values: High, Medium, Low
  const interestValues = ['all', 'High', 'Medium', 'Low'];
  
  // Filter deals by interest
  const filteredDeals = selectedInterest === 'all' 
    ? deals 
    : deals.filter(deal => deal.interest === selectedInterest);
    
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Deals By Interest</h1>
          
          <div className="flex gap-3">
            <Select
              value={selectedInterest}
              onValueChange={setSelectedInterest}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Interest" />
              </SelectTrigger>
              <SelectContent>
                {interestValues.map((interest) => (
                  <SelectItem key={interest} value={interest}>
                    {interest === 'all' ? 'All Interests' : interest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filter
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <PipelineView filteredDeals={filteredDeals} />
        )}
      </div>
    </MainLayout>
  );
};

export default ByInterestPage;