import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DealWithContact } from '@shared/schema';
import MainLayout from '@/layouts/MainLayout';
import PipelineView from '@/components/pipeline/PipelineView';
import { Button } from '@/components/ui/button';
import { Filter, CircleAlert, Beaker, Microscope, Brain, Target, Code } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const ByInterestPage: React.FC = () => {
  const [selectedInterest, setSelectedInterest] = useState<string>('all');
  
  // Fetch all deals
  const { data: deals = [], isLoading } = useQuery<DealWithContact[]>({
    queryKey: ['/api/deals'],
  });
  
  // Use predefined interest values based on biotech categories
  const interestValues = ['all', 'Antibody', 'Chemistry', 'AI/ML technology', 'Target Discovery', 'Software', 'Unknown'];
  
  // Filter deals by interest
  const filteredDeals = selectedInterest === 'all' 
    ? deals 
    : selectedInterest === 'Unknown'
      ? deals.filter(deal => !deal.interest || deal.interest === '')
      : deals.filter(deal => deal.interest === selectedInterest);
  
  // Count deals by interest for display in badges
  const interestCounts = {
    all: deals.length,
    'Antibody': deals.filter(deal => deal.interest === 'Antibody').length,
    'Chemistry': deals.filter(deal => deal.interest === 'Chemistry').length,
    'AI/ML technology': deals.filter(deal => deal.interest === 'AI/ML technology').length,
    'Target Discovery': deals.filter(deal => deal.interest === 'Target Discovery').length,
    'Software': deals.filter(deal => deal.interest === 'Software').length,
    'Unknown': deals.filter(deal => !deal.interest || deal.interest === '').length
  };
  
  // Define interest icons
  const interestIcons: Record<string, React.ReactNode> = {
    'Antibody': <Microscope className="h-3 w-3 mr-1" />,
    'Chemistry': <Beaker className="h-3 w-3 mr-1" />,
    'AI/ML technology': <Brain className="h-3 w-3 mr-1" />,
    'Target Discovery': <Target className="h-3 w-3 mr-1" />,
    'Software': <Code className="h-3 w-3 mr-1" />
  };
  
  // Define interest colors for badges
  const interestColors: Record<string, string> = {
    'Antibody': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    'Chemistry': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    'AI/ML technology': 'bg-green-100 text-green-800 hover:bg-green-200',
    'Target Discovery': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    'Software': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
    'Unknown': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    'all': 'bg-primary/10 text-primary hover:bg-primary/20'
  };
    
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
        
        {/* Interest filter badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge 
            key="all"
            variant="outline" 
            className={`${selectedInterest === 'all' ? interestColors.all : 'bg-white hover:bg-gray-50'} cursor-pointer px-3 py-1`}
            onClick={() => setSelectedInterest('all')}
          >
            All 
            <span className="ml-1 text-xs font-normal">({interestCounts.all})</span>
          </Badge>
          
          {interestValues.filter(i => i !== 'all').map(interest => (
            <Badge 
              key={interest}
              variant="outline" 
              className={`${selectedInterest === interest ? interestColors[interest as keyof typeof interestColors] || '' : 'bg-white hover:bg-gray-50'} cursor-pointer px-3 py-1`}
              onClick={() => setSelectedInterest(interest)}
            >
              {interest !== 'Unknown' && interestIcons[interest as keyof typeof interestIcons]}
              {interest} 
              <span className="ml-1 text-xs font-normal">({interestCounts[interest as keyof typeof interestCounts]})</span>
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
            <p className="text-sm">There are no deals with the selected interest</p>
          </div>
        ) : (
          <PipelineView filteredDeals={filteredDeals} />
        )}
      </div>
    </MainLayout>
  );
};

export default ByInterestPage;