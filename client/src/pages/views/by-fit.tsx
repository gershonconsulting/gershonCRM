import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DealWithContact } from '@shared/schema';
import MainLayout from '@/layouts/MainLayout';
import PipelineView from '@/components/pipeline/PipelineView';
import { Button } from '@/components/ui/button';
import { Filter, CircleAlert } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const ByFitPage: React.FC = () => {
  const [selectedFit, setSelectedFit] = useState<string>('all');
  
  // Fetch all deals
  const { data: deals = [], isLoading } = useQuery<DealWithContact[]>({
    queryKey: ['/api/deals'],
  });
  
  // Use High, Medium, Low fit values as specified
  const fitValues = ['all', 'High', 'Medium', 'Low', 'Unknown'];
  
  // Filter deals by fit
  const filteredDeals = selectedFit === 'all' 
    ? deals 
    : selectedFit === 'Unknown'
      ? deals.filter(deal => !deal.fit || deal.fit === '')
      : deals.filter(deal => deal.fit === selectedFit);

  // Count deals by fit for display in badges
  const fitCounts = {
    all: deals.length,
    High: deals.filter(deal => deal.fit === 'High').length,
    Medium: deals.filter(deal => deal.fit === 'Medium').length,
    Low: deals.filter(deal => deal.fit === 'Low').length,
    Unknown: deals.filter(deal => !deal.fit || deal.fit === '').length
  };
  
  // Define fit colors for badges
  const fitColors: Record<string, string> = {
    High: 'bg-green-100 text-green-800 hover:bg-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    Low: 'bg-red-100 text-red-800 hover:bg-red-200',
    Unknown: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    all: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  };
    
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Deals By Fit</h1>
          
          <div className="flex gap-3">
            <Select
              value={selectedFit}
              onValueChange={setSelectedFit}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Fit" />
              </SelectTrigger>
              <SelectContent>
                {fitValues.map((fit) => (
                  <SelectItem key={fit} value={fit}>
                    {fit === 'all' ? 'All Fits' : fit}
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
        
        {/* Fit filter badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {fitValues.map(fit => (
            <Badge 
              key={fit}
              variant="outline" 
              className={`${selectedFit === fit ? fitColors[fit] || '' : 'bg-white hover:bg-gray-50'} cursor-pointer px-3 py-1`}
              onClick={() => setSelectedFit(fit)}
            >
              {fit === 'all' ? 'All' : fit} 
              <span className="ml-1 text-xs font-normal">({fitCounts[fit as keyof typeof fitCounts]})</span>
            </Badge>
          ))}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <CircleAlert className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No deals found</h3>
            <p className="text-sm">There are no deals with the selected fit criteria</p>
          </div>
        ) : (
          <PipelineView filteredDeals={filteredDeals} />
        )}
      </div>
    </MainLayout>
  );
};

export default ByFitPage;