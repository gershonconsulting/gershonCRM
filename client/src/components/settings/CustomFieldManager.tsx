import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Define custom field types
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox';

export interface CustomField {
  id: number;
  name: string;
  key: string;
  type: FieldType;
  entityType: 'contact' | 'deal';
  required: boolean;
  options?: string[];
  order: number;
}

export default function CustomFieldManager() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<'contact' | 'deal'>('contact');
  const [currentField, setCurrentField] = useState<CustomField | null>(null);
  
  // Form state
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState('');
  
  // Mock custom fields for demo
  const mockContactFields = [
    { id: 1, name: 'Company Size', key: 'company_size', type: 'select' as FieldType, entityType: 'contact' as const, required: false, options: ['1-10', '11-50', '51-200', '201-500', '500+'], order: 1 },
    { id: 2, name: 'Industry', key: 'industry', type: 'select' as FieldType, entityType: 'contact' as const, required: false, options: ['Healthcare', 'Technology', 'Finance', 'Education', 'Manufacturing'], order: 2 },
    { id: 3, name: 'Lead Source', key: 'lead_source', type: 'select' as FieldType, entityType: 'contact' as const, required: false, options: ['Website', 'Referral', 'Event', 'Advertisement', 'Cold Call'], order: 3 },
  ];
  
  const mockDealFields = [
    { id: 4, name: 'Deal Size', key: 'deal_size', type: 'number' as FieldType, entityType: 'deal' as const, required: false, order: 1 },
    { id: 5, name: 'Close Date', key: 'close_date', type: 'date' as FieldType, entityType: 'deal' as const, required: false, order: 2 },
    { id: 6, name: 'Priority', key: 'priority', type: 'select' as FieldType, entityType: 'deal' as const, required: false, options: ['Low', 'Medium', 'High'], order: 3 },
  ];

  // Fetch custom fields (simulated for now)
  const { data: fields, isLoading } = useQuery<CustomField[]>({
    queryKey: ['/api/custom-fields', currentEntity],
    queryFn: async () => {
      // In a real implementation, this would make an API call
      // For now, we'll use mock data
      return currentEntity === 'contact' ? mockContactFields : mockDealFields;
    }
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (newField: Omit<CustomField, 'id' | 'key' | 'order'>) => {
      // Simulate API call
      return {
        ...newField,
        id: Math.floor(Math.random() * 1000),
        key: newField.name.toLowerCase().replace(/\s+/g, '_'),
        order: (fields?.length || 0) + 1
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields', currentEntity] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Field created',
        description: 'The custom field was successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create field: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (field: Partial<CustomField> & { id: number }) => {
      // Simulate API call
      return field;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields', currentEntity] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: 'Field updated',
        description: 'The custom field was successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update field: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulate API call
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-fields', currentEntity] });
      setIsDeleteDialogOpen(false);
      setCurrentField(null);
      toast({
        title: 'Field deleted',
        description: 'The custom field was successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete field: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    
    const options = fieldType === 'select' || fieldType === 'multiselect' 
      ? fieldOptions.split(',').map(o => o.trim()).filter(o => o.length > 0)
      : undefined;
      
    createFieldMutation.mutate({
      name: fieldName,
      type: fieldType,
      entityType: currentEntity,
      required: fieldRequired,
      options,
    });
  };

  const handleUpdateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentField) return;

    const options = fieldType === 'select' || fieldType === 'multiselect' 
      ? fieldOptions.split(',').map(o => o.trim()).filter(o => o.length > 0)
      : undefined;

    updateFieldMutation.mutate({
      id: currentField.id,
      name: fieldName,
      type: fieldType,
      required: fieldRequired,
      options,
    });
  };

  const handleDeleteField = () => {
    if (!currentField) return;
    deleteFieldMutation.mutate(currentField.id);
  };

  const resetForm = () => {
    setFieldName('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldOptions('');
    setCurrentField(null);
  };

  const openEditDialog = (field: CustomField) => {
    setCurrentField(field);
    setFieldName(field.name);
    setFieldType(field.type);
    setFieldRequired(field.required);
    setFieldOptions(field.options?.join(', ') || '');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (field: CustomField) => {
    setCurrentField(field);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Custom Fields</CardTitle>
          <CardDescription>Manage additional information for your contacts and deals</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={currentEntity}
            onValueChange={(value) => setCurrentEntity(value as 'contact' | 'deal')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contact">Contact Fields</SelectItem>
              <SelectItem value="deal">Deal Fields</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md" />
            ))}
          </div>
        ) : fields && fields.length > 0 ? (
          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-3 border rounded-md group hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="mr-3 text-gray-400">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{field.name}</div>
                    <div className="text-sm text-gray-500">
                      Type: {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                      {field.required && ' • Required'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="outline" onClick={() => openEditDialog(field)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => openDeleteDialog(field)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No custom fields found. Create your first custom field.</p>
          </div>
        )}
      </CardContent>

      {/* Create Field Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateField}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Field Name</Label>
                <Input
                  id="name"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g., Company Size"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Field Type</Label>
                <Select
                  value={fieldType}
                  onValueChange={(value) => setFieldType(value as FieldType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Dropdown (Select)</SelectItem>
                    <SelectItem value="multiselect">Multiple Select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(fieldType === 'select' || fieldType === 'multiselect') && (
                <div className="grid gap-2">
                  <Label htmlFor="options">Options (comma separated)</Label>
                  <Input
                    id="options"
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                    placeholder="e.g., Option 1, Option 2, Option 3"
                    required
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  id="required"
                  checked={fieldRequired}
                  onCheckedChange={setFieldRequired}
                />
                <Label htmlFor="required">Required field</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createFieldMutation.isPending}>
                {createFieldMutation.isPending ? 'Creating...' : 'Create Field'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Custom Field</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateField}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Field Name</Label>
                <Input
                  id="name"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g., Company Size"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Field Type</Label>
                <Select
                  value={fieldType}
                  onValueChange={(value) => setFieldType(value as FieldType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Dropdown (Select)</SelectItem>
                    <SelectItem value="multiselect">Multiple Select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(fieldType === 'select' || fieldType === 'multiselect') && (
                <div className="grid gap-2">
                  <Label htmlFor="options">Options (comma separated)</Label>
                  <Input
                    id="options"
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                    placeholder="e.g., Option 1, Option 2, Option 3"
                    required
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  id="required"
                  checked={fieldRequired}
                  onCheckedChange={setFieldRequired}
                />
                <Label htmlFor="required">Required field</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateFieldMutation.isPending}>
                {updateFieldMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Field Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Custom Field</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500">
              Are you sure you want to delete the <strong>{currentField?.name}</strong> field?
              This will remove this field and all associated data from your {currentEntity}s.
            </p>
            <p className="text-red-500 mt-4">
              Warning: This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentField(null);
                setIsDeleteDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteField}
              disabled={deleteFieldMutation.isPending}
            >
              {deleteFieldMutation.isPending ? 'Deleting...' : 'Delete Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}