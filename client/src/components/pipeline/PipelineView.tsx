import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import PipelineColumn from './PipelineColumn';
import { DealWithContact, DealStage } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, Plus } from 'lucide-react';
import DealDetailDialog from '@/components/deals/DealDetailDialog';
import DealForm from '@/components/deals/DealForm';

interface PipelineViewProps {
  onNewDeal?: () => void;
}

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const dealId = Number(active.id);
    const newStageId = Number(over.id);
    
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stageId === newStageId) return;
    
    try {
      await apiRequest('PUT', `/api/deals/${dealId}`, { stageId: newStageId });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      
      // Create an activity for this stage change
      const stage = stages.find(s => s.id === newStageId);
      if (stage) {
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

  const handleDealClick = (deal: DealWithContact) => {
    setSelectedDeal(deal);
    setIsDetailOpen(true);
  };

  const handleNewDeal = () => {
    setSelectedDeal(null);
    setIsFormOpen(true);
    if (onNewDeal) onNewDeal();
  };

  return (
    <div className="mt-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold leading-7 text-gray-900 sm:text-xl sm:truncate">
            Deal Pipeline
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Select defaultValue="main">
            <SelectTrigger className="w-[200px] mr-2">
              <SelectValue placeholder="Select pipeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main Sales Pipeline</SelectItem>
              <SelectItem value="enterprise">Enterprise Pipeline</SelectItem>
              <SelectItem value="smb">SMB Pipeline</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="mt-4 overflow-x-auto pipeline-scrollbar">
        <div className="inline-block min-w-full pb-2">
          <DndContext 
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-4" style={{ minWidth: '1000px' }}>
              <SortableContext 
                items={stages.map(stage => stage.id.toString())}
                strategy={horizontalListSortingStrategy}
              >
                {stages.map(stage => {
                  const stageDeals = deals.filter(deal => deal.stageId === stage.id);
                  const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
                  
                  return (
                    <PipelineColumn
                      key={stage.id}
                      id={stage.id.toString()}
                      title={stage.name}
                      count={stageDeals.length}
                      value={totalValue}
                      probability={stage.probability}
                      color={stage.color}
                      deals={stageDeals}
                      onDealClick={handleDealClick}
                    />
                  );
                })}
              </SortableContext>
            </div>
          </DndContext>
        </div>
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
