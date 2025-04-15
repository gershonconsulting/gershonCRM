import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DealWithContact, DealStage } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Filter, Plus, ChevronDown } from 'lucide-react';
import DealDetailDialog from '@/components/deals/DealDetailDialog';
import DealForm from '@/components/deals/DealForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface PipelineViewProps {
  onNewDeal?: () => void;
}

// Updated colors to match the screenshot
const stageColors = {
  "Lead": "#FF5630", // red
  "Contacted": "#FCA44C", // orange
  "Reccommend By QC": "#F39C12", // orange-yellow
  "Call Scheduled": "#F1C40F", // yellow
  "Connected": "#2ECC71", // green
  "Engaged": "#27AE60", // darker green
  "Proposal Sent": "#3498DB", // blue
  "WON": "#2980B9", // darker blue
  "Later Stage": "#8E44AD", // purple
  "Recycled": "#95A5A6", // gray
};

const PipelineView: React.FC<PipelineViewProps> = ({ onNewDeal }) => {
  const queryClient = useQueryClient();
  const [selectedDeal, setSelectedDeal] = useState<DealWithContact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Fetch pipeline stages
  const { data: stages = [] } = useQuery<DealStage[]>({
    queryKey: ['/api/deal-stages'],
  });

  // Fetch deals
  const { data: deals = [] } = useQuery<DealWithContact[]>({
    queryKey: ['/api/deals'],
  });

  const handleDealClick = (deal: DealWithContact) => {
    setSelectedDeal(deal);
    setIsDetailOpen(true);
  };

  const handleNewDeal = () => {
    setSelectedDeal(null);
    setIsFormOpen(true);
    if (onNewDeal) onNewDeal();
  };

  const handleStageChange = async (dealId: number, newStageId: number) => {
    try {
      await apiRequest('PUT', `/api/deals/${dealId}`, { stageId: newStageId });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      
      // Create an activity for this stage change
      const stage = stages.find(s => s.id === newStageId);
      const deal = deals.find(d => d.id === dealId);
      
      if (stage && deal) {
        await apiRequest('POST', '/api/activities', {
          type: 'deal_update',
          description: `Deal moved to ${stage.name} stage`,
          dealId,
          contactId: deal.contactId,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      }
    } catch (error) {
      console.error('Failed to update deal stage', error);
    }
  };

  // Order stages by their order property
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  // Group deals by stage
  const dealsByStage = sortedStages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stageId === stage.id);
    return acc;
  }, {} as Record<number, DealWithContact[]>);

  return (
    <div className="mt-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold leading-7 text-gray-900 sm:text-xl sm:truncate">
            Deal Pipeline
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button variant="outline" className="mr-2">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={handleNewDeal}>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="mt-6 flex space-x-1 overflow-x-auto">
        {sortedStages.map(stage => {
          const stageDeals = dealsByStage[stage.id] || [];
          const width = `${Math.max(5, Math.min(25, (stageDeals.length / deals.length) * 100))}%`;
          
          return (
            <div 
              key={stage.id} 
              className="flex-shrink-0 text-center text-white font-medium rounded-sm overflow-hidden"
              style={{ 
                width, 
                backgroundColor: stageColors[stage.name as keyof typeof stageColors] || stage.color,
                padding: '8px 4px'
              }}
            >
              <div className="text-lg font-bold">{stageDeals.length}</div>
              <div className="text-xs">{stage.name}</div>
            </div>
          );
        })}
      </div>

      {/* Deals Table View */}
      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Checkbox /></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contacts and organizations</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Thread</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Done</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStages.map(stage => {
              const stageDeals = dealsByStage[stage.id] || [];
              if (stageDeals.length === 0) return null;
              
              return (
                <React.Fragment key={stage.id}>
                  <TableRow className="group bg-gray-50">
                    <TableCell colSpan={8} className="py-2">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-sm mr-2"
                          style={{ backgroundColor: stageColors[stage.name as keyof typeof stageColors] || stage.color }}
                        />
                        <span className="font-medium">{stage.name}</span>
                        <span className="ml-2 text-gray-500">({stageDeals.length})</span>
                        <ChevronDown className="ml-2 h-4 w-4" />
                        <Button variant="ghost" size="sm" className="ml-2">
                          <Plus className="h-3 w-3 mr-1" /> Add Deal
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {stageDeals.map(deal => (
                    <TableRow 
                      key={deal.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleDealClick(deal)}
                    >
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>{deal.name}</TableCell>
                      <TableCell>{deal.contact?.name || deal.contact?.company || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-sm mr-2"
                            style={{ backgroundColor: stageColors[stage.name as keyof typeof stageColors] || stage.color }}
                          />
                          {stage.name}
                        </div>
                      </TableCell>
                      <TableCell>{deal.source || '-'}</TableCell>
                      <TableCell>
                        {deal.thread ? (
                          <a 
                            href={deal.thread} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Thread
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{deal.notes || '-'}</TableCell>
                      <TableCell><Checkbox checked={deal.done} /></TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Deal Detail Dialog */}
      {selectedDeal && (
        <DealDetailDialog
          deal={selectedDeal}
          isOpen={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onEdit={() => {
            setIsDetailOpen(false);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* Deal Form Dialog */}
      <DealForm
        deal={selectedDeal}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
        }}
      />
    </div>
  );
};

export default PipelineView;
