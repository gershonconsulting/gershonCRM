import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DealWithContact, DealStage } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Filter, Plus, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import DealDetailDialog from '@/components/deals/DealDetailDialog';
import DealForm from '@/components/deals/DealForm';
import { Checkbox } from "@/components/ui/checkbox";
import { UserRole, useUserRole } from "@/hooks/use-user-role";
import RoleBasedAccess from "@/components/auth/RoleBasedAccess";
import { ResizableTableHeader } from '@/components/ui/resizable-table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PipelineViewProps {
  onNewDeal?: () => void;
  filteredDeals?: DealWithContact[]; // Optional prop for filtered deals
}

// Updated colors to exactly match the screenshot
const stageColors = {
  "Lead": "#E73C37", // bright red
  "Contacted": "#F37021", // orange
  "Recommend By QC": "#FAA21B", // gold/amber
  "Call Scheduled": "#F8C300", // yellow
  "Connected": "#DAED56", // lime green
  "Engaged": "#97C93D", // grass green
  "Proposal Sent": "#00A94F", // emerald green
  "WON": "#009444", // forest green
  "Later Stage": "#0072BC", // blue
  "Recycled": "#2E3192", // indigo/purple
};

const PipelineView: React.FC<PipelineViewProps> = ({ onNewDeal, filteredDeals }) => {
  const queryClient = useQueryClient();
  const [selectedDeal, setSelectedDeal] = useState<DealWithContact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Fetch pipeline stages
  const { data: stages = [] } = useQuery<DealStage[]>({
    queryKey: ['/api/deal-stages'],
  });

  // Fetch deals
  const { data: fetchedDeals = [] } = useQuery<DealWithContact[]>({
    queryKey: ['/api/deals'],
  });
  
  // Use filtered deals if provided, otherwise use all deals
  const deals = filteredDeals || fetchedDeals;

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

  const { role } = useUserRole();
  
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
          <RoleBasedAccess allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
            <Button onClick={handleNewDeal}>
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </RoleBasedAccess>
        </div>
      </div>
      
      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-6">
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Active Deals</p>
          <p className="text-2xl font-bold">{deals.length}</p>
          <div className="mt-2 flex items-center text-xs">
            <span className="text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              5.3%
            </span>
            <span className="ml-1 text-gray-500">vs last week</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Deals Won This Month</p>
          <p className="text-2xl font-bold">
            {deals.filter(d => d.stage?.name === 'WON').length}
          </p>
          <div className="mt-2 flex items-center text-xs">
            <span className="text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              12.5%
            </span>
            <span className="ml-1 text-gray-500">vs previous month</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Average Leads Per Month</p>
          <p className="text-2xl font-bold">87</p>
          <div className="mt-2 flex items-center text-xs">
            <span className="text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              24.7%
            </span>
            <span className="ml-1 text-gray-500">vs last month</span>
          </div>
        </div>
      </div>

      {/* Pipeline Summary - Exact match to the image */}
      <div className="mt-6 rounded-md overflow-hidden">
        <div className="flex w-full">
          {sortedStages.map(stage => {
            const stageDeals = dealsByStage[stage.id] || [];
            // Calculate proportional width based on total deals
            const totalDeals = Object.values(dealsByStage).flat().length;
            const width = totalDeals > 0 
              ? `${Math.max(5, Math.min(25, (stageDeals.length / totalDeals) * 100))}%` 
              : "10%"; // Equal width if no deals
            
            return (
              <div 
                key={stage.id} 
                className="text-center text-white font-medium"
                style={{ 
                  width, 
                  backgroundColor: stageColors[stage.name as keyof typeof stageColors] || stage.color,
                  padding: '8px 0'
                }}
              >
                <div className="text-xl font-bold">{stageDeals.length}</div>
                <div className="text-xs">{stage.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deals Table View */}
      <div className="mt-6">
        {/* Column configuration */}
        {(() => {
          const [columns, setColumns] = useState([
            { id: 'checkbox', label: <Checkbox />, width: 5, minWidth: 3, maxWidth: 8 },
            { id: 'name', label: 'Name', width: 20, minWidth: 10, maxWidth: 30 },
            { id: 'contact', label: 'Contacts and organizations', width: 20, minWidth: 10, maxWidth: 30 },
            { id: 'stage', label: 'Stage', width: 15, minWidth: 8, maxWidth: 25 },
            { id: 'source', label: 'Source', width: 10, minWidth: 5, maxWidth: 20 },
            { id: 'thread', label: 'Thread', width: 10, minWidth: 5, maxWidth: 20 },
            { id: 'notes', label: 'Notes', width: 15, minWidth: 10, maxWidth: 30 },
            { id: 'done', label: 'Done', width: 5, minWidth: 3, maxWidth: 10 },
          ]);

          const handleColumnsChange = (newColumns: any) => {
            setColumns(newColumns);
          };

          return (
            <div className="border rounded-md overflow-hidden">
              {/* Resizable and reorderable table header */}
              <ResizableTableHeader
                columns={columns}
                allowReordering={true}
                allowResizing={true}
                onColumnsChange={handleColumnsChange}
                className="bg-gray-50"
              />
              
              {/* Table content */}
              <div className="divide-y divide-gray-200">
                {sortedStages.map(stage => {
                  const stageDeals = dealsByStage[stage.id] || [];
                  if (stageDeals.length === 0) return null;
                  
                  return (
                    <div key={stage.id}>
                      {/* Stage header */}
                      <div className="bg-gray-50 text-xs py-1 px-2">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-sm mr-1"
                            style={{ backgroundColor: stageColors[stage.name as keyof typeof stageColors] || stage.color }}
                          />
                          <span className="font-medium">{stage.name}</span>
                          <span className="ml-1 text-gray-500">({stageDeals.length})</span>
                          <ChevronDown className="ml-1 h-3 w-3" />
                          <RoleBasedAccess allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-1 h-6 px-2 py-0 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNewDeal();
                              }}
                            >
                              <Plus className="h-2 w-2 mr-1" /> Add
                            </Button>
                          </RoleBasedAccess>
                        </div>
                      </div>
                      
                      {/* Deals for this stage */}
                      {stageDeals.map(deal => {
                        // Determine which cell content to render based on column order
                        const renderCellContent = (colId: string) => {
                          switch (colId) {
                            case 'checkbox':
                              return <Checkbox />;
                            case 'name':
                              return <div className="font-medium">{deal.name}</div>;
                            case 'contact':
                              return deal.contact?.name || deal.contact?.company || '-';
                            case 'stage':
                              return (
                                <div className="flex items-center">
                                  <div 
                                    className="w-2 h-2 rounded-sm mr-1"
                                    style={{ backgroundColor: stageColors[stage.name as keyof typeof stageColors] || stage.color }}
                                  />
                                  <Select 
                                    defaultValue={stage.id.toString()} 
                                    onValueChange={(newStageId) => {
                                      // Prevent click event from bubbling up to the row
                                      const event = window.event;
                                      if (event) {
                                        event.stopPropagation();
                                      }
                                      handleStageChange(deal.id, parseInt(newStageId));
                                    }}
                                  >
                                    <SelectTrigger className="h-6 py-0 pl-0 pr-1 border-0 bg-transparent hover:bg-gray-100 font-normal text-xs">
                                      <SelectValue>{stage.name}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sortedStages.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()} className="text-xs py-1">
                                          <div className="flex items-center">
                                            <div 
                                              className="w-2 h-2 rounded-sm mr-1"
                                              style={{ backgroundColor: stageColors[s.name as keyof typeof stageColors] || s.color }}
                                            />
                                            {s.name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            case 'source':
                              return deal.source || '-';
                            case 'thread':
                              return deal.thread ? (
                                <a 
                                  href={deal.thread} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Thread
                                </a>
                              ) : '-';
                            case 'notes':
                              return deal.notes || '-';
                            case 'done':
                              return deal.done !== null && <Checkbox checked={Boolean(deal.done)} />;
                            default:
                              return null;
                          }
                        };

                        // Render the row with cells in the correct order
                        return (
                          <div 
                            key={deal.id}
                            className="cursor-pointer hover:bg-gray-50 text-xs px-2 py-1 grid grid-cols-8 gap-2"
                            onClick={() => handleDealClick(deal)}
                          >
                            {columns.map(col => (
                              <div key={col.id} className="truncate" style={{ width: '100%' }}>
                                {renderCellContent(col.id)}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
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
