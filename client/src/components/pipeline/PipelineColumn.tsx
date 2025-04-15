import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DealCard from './DealCard';
import { Badge } from '@/components/ui/badge';
import { DealWithContact } from '@shared/schema';

interface PipelineColumnProps {
  id: string;
  title: string;
  count: number;
  value: number;
  probability: number;
  color: string;
  deals: DealWithContact[];
  onDealClick: (deal: DealWithContact) => void;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({
  id,
  title,
  count,
  value,
  probability,
  color,
  deals,
  onDealClick,
}) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  // No monetary values displayed

  // Badge variant based on color
  const getBadgeVariant = (color: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'info',
      'indigo': 'indigo',
      'purple': 'purple',
      'pink': 'pink',
      'green': 'success',
    };
    return colorMap[color] || 'default';
  };

  return (
    <div className="flex flex-col w-72">
      <div className="bg-gray-100 rounded-t-md p-3 flex justify-between items-center border-b border-gray-200">
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{count} deals</p>
        </div>
        <Badge variant={getBadgeVariant(color)}>
          {probability}%
        </Badge>
      </div>
      <div 
        ref={setNodeRef}
        className="flex-1 bg-gray-50 rounded-b-md p-2 space-y-2 min-h-[200px]"
      >
        <SortableContext
          items={deals.map(deal => deal.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {deals.map(deal => (
            <DealCard 
              key={deal.id} 
              deal={deal} 
              onClick={onDealClick}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default PipelineColumn;
