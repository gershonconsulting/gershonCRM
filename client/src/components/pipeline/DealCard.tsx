import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DealWithContact } from '@shared/schema';

interface DealCardProps {
  deal: DealWithContact;
  onClick: (deal: DealWithContact) => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: deal.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get initials for the avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // No monetary values displayed

  // Badge variant based on stage color
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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-md shadow-sm border border-gray-200 cursor-move hover:shadow-md transition duration-150 ease-in-out"
      onClick={() => onClick(deal)}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900 text-sm">{deal.name}</h4>
      </div>
      <p className="mt-1 text-xs text-gray-500 line-clamp-1">{deal.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(deal.contact.name)}&background=random`} alt={deal.contact.name} />
            <AvatarFallback>{getInitials(deal.contact.name)}</AvatarFallback>
          </Avatar>
          <span className="ml-1.5 text-xs text-gray-500">{deal.contact.name}</span>
        </div>
        <Badge variant={getBadgeVariant(deal.stage.color)}>
          {deal.stage.name}
        </Badge>
      </div>
    </div>
  );
};

export default DealCard;
