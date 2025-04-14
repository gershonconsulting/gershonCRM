import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Check, Circle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { DealWithContact } from '@shared/schema';

interface DealDetailDialogProps {
  deal: DealWithContact;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

const DealDetailDialog: React.FC<DealDetailDialogProps> = ({
  deal,
  isOpen,
  onOpenChange,
  onEdit,
}) => {
  // Format the value as currency
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(deal.value);

  // Format date
  const formattedDate = format(new Date(deal.createdAt), 'MMM dd, yyyy');

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

  const nextSteps = deal.nextSteps ? deal.nextSteps.split(',').map(step => step.trim()) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{deal.name}</DialogTitle>
            <Badge variant={getBadgeVariant(deal.stage.color)}>
              {deal.stage.name}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Deal Value</span>
            <span className="text-sm font-medium text-gray-900">{formattedValue}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Probability</span>
            <span className="text-sm font-medium text-gray-900">{deal.stage.probability}%</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Contact</span>
            <span className="text-sm font-medium text-gray-900">{deal.contact.name}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Created</span>
            <span className="text-sm font-medium text-gray-900">{formattedDate}</span>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
          <p className="text-sm text-gray-500">
            {deal.description || "No description available."}
          </p>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Next Steps</h4>
          {nextSteps.length > 0 ? (
            nextSteps.map((step, index) => (
              <div key={index} className="flex items-center text-sm mb-2">
                {index < Math.min(2, nextSteps.length) ? (
                  <Check className="h-4 w-4 text-gray-400 mr-2" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 mr-2" />
                )}
                <span className={index < Math.min(2, nextSteps.length) ? 'text-gray-500 line-through' : 'text-gray-700'}>
                  {step}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No next steps defined.</p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>
            Edit Deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DealDetailDialog;
