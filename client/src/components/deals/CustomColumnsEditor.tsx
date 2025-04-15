import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink, Edit, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EditableField from './EditableField';
import { Deal } from '@shared/schema';

interface CustomColumnsEditorProps {
  deal: Deal;
  onDealUpdated?: () => void;
}

const CustomColumnsEditor: React.FC<CustomColumnsEditorProps> = ({
  deal,
  onDealUpdated
}) => {
  const queryClient = useQueryClient();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnType, setNewColumnType] = useState('');
  const [newColumnValue, setNewColumnValue] = useState('');
  
  // Preset options for Fit and Interest
  const fitOptions = ['High', 'Medium', 'Low', 'Unknown'];
  const interestOptions = [
    'Antibody', 
    'Chemistry', 
    'AI/ML technology', 
    'Target Discovery', 
    'Software',
    'Other'
  ];

  const handleUpdateField = async (field: keyof Deal, value: string) => {
    try {
      await apiRequest('PUT', `/api/deals/${deal.id}`, { 
        [field]: value 
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      if (onDealUpdated) onDealUpdated();
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnType || !newColumnValue) return;
    
    try {
      await apiRequest('PUT', `/api/deals/${deal.id}`, { 
        [newColumnType]: newColumnValue 
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      setIsAddingColumn(false);
      setNewColumnType('');
      setNewColumnValue('');
      if (onDealUpdated) onDealUpdated();
    } catch (error) {
      console.error('Failed to add custom column:', error);
    }
  };

  const renderFieldEditor = (field: keyof Deal, label: string, options?: string[]) => {
    if (options) {
      return (
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <Select
            value={deal[field] as string || ''}
            onValueChange={(value) => handleUpdateField(field, value)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    return (
      <EditableField
        label={label}
        value={deal[field] as string || ''}
        onChange={(value) => handleUpdateField(field, value)}
        isLink={field === 'thread'}
      />
    );
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-4 flex justify-between items-center">
        <span>Custom Columns</span>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 px-2"
          onClick={() => setIsAddingColumn(true)}
        >
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </h3>
      
      {isAddingColumn && (
        <div className="mb-4 p-3 border rounded-md">
          <h4 className="text-sm font-medium mb-2">Add Custom Column</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Column Type</label>
              <Select
                value={newColumnType}
                onValueChange={setNewColumnType}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select column type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="thread">Thread</SelectItem>
                  <SelectItem value="nextSteps">Next Steps</SelectItem>
                  <SelectItem value="fit">Fit</SelectItem>
                  <SelectItem value="interest">Interest</SelectItem>
                  <SelectItem value="customField">Custom Field</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newColumnType === 'fit' ? (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Value</label>
                <Select
                  value={newColumnValue}
                  onValueChange={setNewColumnValue}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select fit" />
                  </SelectTrigger>
                  <SelectContent>
                    {fitOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : newColumnType === 'interest' ? (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Value</label>
                <Select
                  value={newColumnValue}
                  onValueChange={setNewColumnValue}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select interest" />
                  </SelectTrigger>
                  <SelectContent>
                    {interestOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Value</label>
                <Input
                  value={newColumnValue}
                  onChange={(e) => setNewColumnValue(e.target.value)}
                  className="text-sm"
                  placeholder="Enter value"
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsAddingColumn(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleAddColumn}
              >
                Add Column
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {renderFieldEditor('source', 'Source')}
        
        {deal.thread && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Thread</p>
            <div className="flex items-center justify-between">
              <a 
                href={deal.thread} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                {deal.thread.substring(0, 30)}...
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleUpdateField('thread', '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {renderFieldEditor('nextSteps', 'Next Steps')}
        {renderFieldEditor('fit', 'Fit', fitOptions)}
        {renderFieldEditor('interest', 'Interest', interestOptions)}
      </div>
    </div>
  );
};

export default CustomColumnsEditor;