import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Edit2, Trash2, Eye, Columns } from 'lucide-react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from 'wouter';
import { CustomField } from './CustomFieldManager';

// Define view types
export type ViewType = 'list' | 'kanban' | 'calendar';
export type FilterOperator = 'equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';

export interface ViewFilter {
  id: number;
  fieldId: number;
  operator: FilterOperator;
  value: string;
}

export interface CustomView {
  id: number;
  name: string;
  description?: string;
  type: ViewType;
  entityType: 'contact' | 'deal';
  isDefault: boolean;
  filters: ViewFilter[];
  columns: number[]; // Array of field IDs to display as columns
  sortBy?: number; // Field ID to sort by
  sortDirection?: 'asc' | 'desc';
}

export default function ViewManager() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<'contact' | 'deal'>('contact');
  const [currentView, setCurrentView] = useState<CustomView | null>(null);
  
  // Form state
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [viewType, setViewType] = useState<ViewType>('list');
  const [selectedFields, setSelectedFields] = useState<number[]>([]);
  const [sortField, setSortField] = useState<number | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<ViewFilter[]>([]);
  
  // Mock custom fields data
  const mockContactFields = [
    { id: 1, name: 'Name', key: 'name', type: 'text' as const, entityType: 'contact' as const, required: true, order: 0 },
    { id: 2, name: 'Email', key: 'email', type: 'text' as const, entityType: 'contact' as const, required: false, order: 1 },
    { id: 3, name: 'Phone', key: 'phone', type: 'text' as const, entityType: 'contact' as const, required: false, order: 2 },
    { id: 4, name: 'Company', key: 'company', type: 'text' as const, entityType: 'contact' as const, required: true, order: 3 },
    { id: 5, name: 'Company Size', key: 'company_size', type: 'select' as const, entityType: 'contact' as const, required: false, options: ['1-10', '11-50', '51-200', '201-500', '500+'], order: 4 },
    { id: 6, name: 'Industry', key: 'industry', type: 'select' as const, entityType: 'contact' as const, required: false, options: ['Healthcare', 'Technology', 'Finance', 'Education', 'Manufacturing'], order: 5 },
    { id: 7, name: 'Lead Source', key: 'lead_source', type: 'select' as const, entityType: 'contact' as const, required: false, options: ['Website', 'Referral', 'Event', 'Advertisement', 'Cold Call'], order: 6 },
  ];
  
  const mockDealFields = [
    { id: 11, name: 'Name', key: 'name', type: 'text' as const, entityType: 'deal' as const, required: true, order: 0 },
    { id: 12, name: 'Value', key: 'value', type: 'number' as const, entityType: 'deal' as const, required: true, order: 1 },
    { id: 13, name: 'Stage', key: 'stage', type: 'select' as const, entityType: 'deal' as const, required: true, order: 2 },
    { id: 14, name: 'Close Date', key: 'close_date', type: 'date' as const, entityType: 'deal' as const, required: false, order: 3 },
    { id: 15, name: 'Priority', key: 'priority', type: 'select' as const, entityType: 'deal' as const, required: false, options: ['Low', 'Medium', 'High'], order: 4 },
  ];

  // Mock view data
  const mockContactViews = [
    { 
      id: 1, 
      name: 'All Contacts', 
      type: 'list' as ViewType, 
      entityType: 'contact' as const, 
      isDefault: true,
      filters: [],
      columns: [1, 2, 3, 4, 5, 6]
    },
    { 
      id: 2, 
      name: 'By Fit', 
      description: 'Contacts organized by company fit', 
      type: 'list' as ViewType, 
      entityType: 'contact' as const, 
      isDefault: false,
      filters: [],
      columns: [1, 4, 5, 6]
    },
    { 
      id: 3, 
      name: 'By Interest', 
      description: 'Contacts organized by interest level', 
      type: 'list' as ViewType, 
      entityType: 'contact' as const, 
      isDefault: false,
      filters: [],
      columns: [1, 4, 7]
    }
  ];
  
  const mockDealViews = [
    { 
      id: 4, 
      name: 'All Deals', 
      type: 'kanban' as ViewType, 
      entityType: 'deal' as const, 
      isDefault: true,
      filters: [],
      columns: [11, 12, 14, 15]
    },
    { 
      id: 5, 
      name: 'High Priority Deals', 
      description: 'Focus on high priority deals', 
      type: 'list' as ViewType, 
      entityType: 'deal' as const, 
      isDefault: false,
      filters: [{ id: 1, fieldId: 15, operator: 'equals' as FilterOperator, value: 'High' }],
      columns: [11, 12, 13, 14]
    }
  ];

  // Fetch views (simulated for now)
  const { data: views, isLoading: isLoadingViews } = useQuery<CustomView[]>({
    queryKey: ['/api/custom-views', currentEntity],
    queryFn: async () => {
      // In a real implementation, this would make an API call
      // For now, we'll use mock data
      return currentEntity === 'contact' ? mockContactViews : mockDealViews;
    }
  });

  // Fetch fields (simulated for now)
  const { data: fields, isLoading: isLoadingFields } = useQuery<CustomField[]>({
    queryKey: ['/api/custom-fields', currentEntity],
    queryFn: async () => {
      // In a real implementation, this would make an API call
      // For now, we'll use mock data
      return currentEntity === 'contact' ? mockContactFields : mockDealFields;
    }
  });

  // Create view mutation
  const createViewMutation = useMutation({
    mutationFn: async (newView: Omit<CustomView, 'id'>) => {
      // Simulate API call
      return {
        ...newView,
        id: Math.floor(Math.random() * 1000),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-views', currentEntity] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'View created',
        description: 'The custom view was successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create view: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update view mutation
  const updateViewMutation = useMutation({
    mutationFn: async (view: Partial<CustomView> & { id: number }) => {
      // Simulate API call
      return view;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-views', currentEntity] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: 'View updated',
        description: 'The custom view was successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update view: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete view mutation
  const deleteViewMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulate API call
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-views', currentEntity] });
      setIsDeleteDialogOpen(false);
      setCurrentView(null);
      toast({
        title: 'View deleted',
        description: 'The custom view was successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete view: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleCreateView = (e: React.FormEvent) => {
    e.preventDefault();
      
    createViewMutation.mutate({
      name: viewName,
      description: viewDescription || undefined,
      type: viewType,
      entityType: currentEntity,
      isDefault: false,
      filters: filters,
      columns: selectedFields,
      sortBy: sortField,
      sortDirection: sortDirection,
    });
  };

  const handleUpdateView = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentView) return;

    updateViewMutation.mutate({
      id: currentView.id,
      name: viewName,
      description: viewDescription || undefined,
      type: viewType,
      filters: filters,
      columns: selectedFields,
      sortBy: sortField,
      sortDirection: sortDirection,
    });
  };

  const handleDeleteView = () => {
    if (!currentView) return;
    deleteViewMutation.mutate(currentView.id);
  };

  const resetForm = () => {
    setViewName('');
    setViewDescription('');
    setViewType('list');
    setSelectedFields([]);
    setSortField(undefined);
    setSortDirection('asc');
    setFilters([]);
    setCurrentView(null);
  };

  const openEditDialog = (view: CustomView) => {
    setCurrentView(view);
    setViewName(view.name);
    setViewDescription(view.description || '');
    setViewType(view.type);
    setSelectedFields(view.columns);
    setSortField(view.sortBy);
    setSortDirection(view.sortDirection || 'asc');
    setFilters(view.filters);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (view: CustomView) => {
    setCurrentView(view);
    setIsDeleteDialogOpen(true);
  };

  const handleAddFilter = () => {
    if (!fields || fields.length === 0) return;
    
    const newFilter: ViewFilter = {
      id: filters.length > 0 ? Math.max(...filters.map(f => f.id)) + 1 : 1,
      fieldId: fields[0].id,
      operator: 'equals',
      value: '',
    };
    
    setFilters([...filters, newFilter]);
  };
  
  const handleRemoveFilter = (id: number) => {
    setFilters(filters.filter(f => f.id !== id));
  };
  
  const handleFilterChange = (id: number, updates: Partial<ViewFilter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const toggleFieldSelection = (fieldId: number) => {
    if (selectedFields.includes(fieldId)) {
      setSelectedFields(selectedFields.filter(id => id !== fieldId));
    } else {
      setSelectedFields([...selectedFields, fieldId]);
    }
  };

  const getOperatorLabel = (operator: FilterOperator): string => {
    switch (operator) {
      case 'equals': return 'Equals';
      case 'contains': return 'Contains';
      case 'greater_than': return 'Greater than';
      case 'less_than': return 'Less than';
      case 'is_empty': return 'Is empty';
      case 'is_not_empty': return 'Is not empty';
      default: return operator;
    }
  };
  
  const getFieldById = (id: number): CustomField | undefined => {
    return fields?.find(f => f.id === id);
  };

  const fieldOperators = (fieldType: string): FilterOperator[] => {
    switch (fieldType) {
      case 'text':
        return ['equals', 'contains', 'is_empty', 'is_not_empty'];
      case 'number':
      case 'date':
        return ['equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];
      case 'select':
      case 'multiselect':
        return ['equals', 'is_empty', 'is_not_empty'];
      case 'checkbox':
        return ['equals'];
      default:
        return ['equals', 'contains'];
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Custom Views</CardTitle>
          <CardDescription>Create and manage different ways to view your data</CardDescription>
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
              <SelectItem value="contact">Contact Views</SelectItem>
              <SelectItem value="deal">Deal Views</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create View
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingViews ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md" />
            ))}
          </div>
        ) : views && views.length > 0 ? (
          <div className="space-y-2">
            {views.map((view) => (
              <div
                key={view.id}
                className="flex items-center justify-between p-3 border rounded-md group hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="mr-3 text-primary">
                    {view.type === 'list' ? (
                      <Columns className="h-5 w-5" />
                    ) : view.type === 'kanban' ? (
                      <Columns className="h-5 w-5" />
                    ) : (
                      <Columns className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {view.name}
                      {view.isDefault && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {view.description || `${view.type.charAt(0).toUpperCase() + view.type.slice(1)} view`}
                      {view.filters.length > 0 && ` • ${view.filters.length} filter${view.filters.length !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/views/${view.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => openEditDialog(view)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {!view.isDefault && (
                      <Button size="icon" variant="outline" onClick={() => openDeleteDialog(view)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No custom views found. Create your first view.</p>
          </div>
        )}
      </CardContent>

      {/* Create/Edit View Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          resetForm();
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'Edit View' : 'Create New View'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditDialogOpen ? handleUpdateView : handleCreateView}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">View Name</Label>
                <Input
                  id="name"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="e.g., High Value Deals"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={viewDescription}
                  onChange={(e) => setViewDescription(e.target.value)}
                  placeholder="e.g., Deals with a value greater than $10,000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">View Type</Label>
                <Select
                  value={viewType}
                  onValueChange={(value) => setViewType(value as ViewType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select view type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="kanban">Kanban</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="columns">
                  <AccordionTrigger>Columns to Display</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {isLoadingFields ? (
                        <p>Loading fields...</p>
                      ) : fields && fields.length > 0 ? (
                        <div className="space-y-2">
                          {fields.map((field) => (
                            <div key={field.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`field-${field.id}`} 
                                checked={selectedFields.includes(field.id)}
                                onCheckedChange={() => toggleFieldSelection(field.id)}
                              />
                              <Label 
                                htmlFor={`field-${field.id}`}
                                className="cursor-pointer"
                              >
                                {field.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No fields available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sorting">
                  <AccordionTrigger>Sorting</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Label htmlFor="sortField">Sort By</Label>
                          <Select
                            value={sortField?.toString() || ''}
                            onValueChange={(value) => setSortField(value ? parseInt(value, 10) : undefined)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {fields?.map((field) => (
                                <SelectItem key={field.id} value={field.id.toString()}>
                                  {field.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="sortDirection">Direction</Label>
                          <Select
                            value={sortDirection}
                            onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}
                            disabled={!sortField}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Order" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Ascending</SelectItem>
                              <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="filters">
                  <AccordionTrigger>Filters</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {filters.length > 0 ? (
                        <div className="space-y-4">
                          {filters.map((filter) => {
                            const field = getFieldById(filter.fieldId);
                            const operators = field ? fieldOperators(field.type) : [];
                            const requiresValue = filter.operator !== 'is_empty' && filter.operator !== 'is_not_empty';
                            
                            return (
                              <div key={filter.id} className="flex items-center space-x-2">
                                <div className="grid grid-cols-12 gap-2 flex-1">
                                  <div className="col-span-4">
                                    <Select
                                      value={filter.fieldId.toString()}
                                      onValueChange={(value) => handleFilterChange(filter.id, { fieldId: parseInt(value, 10) })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {fields?.map((field) => (
                                          <SelectItem key={field.id} value={field.id.toString()}>
                                            {field.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="col-span-3">
                                    <Select
                                      value={filter.operator}
                                      onValueChange={(value) => handleFilterChange(filter.id, { operator: value as FilterOperator })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Operator" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {operators.map((op) => (
                                          <SelectItem key={op} value={op}>
                                            {getOperatorLabel(op)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="col-span-4">
                                    {requiresValue && (
                                      field?.type === 'select' && field.options ? (
                                        <Select
                                          value={filter.value}
                                          onValueChange={(value) => handleFilterChange(filter.id, { value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select value" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {field.options.map((option) => (
                                              <SelectItem key={option} value={option}>
                                                {option}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Input
                                          value={filter.value}
                                          onChange={(e) => handleFilterChange(filter.id, { value: e.target.value })}
                                          placeholder="Value"
                                          type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
                                        />
                                      )
                                    )}
                                  </div>
                                  <div className="col-span-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveFilter(filter.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No filters added yet.</p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddFilter}
                        disabled={!fields || fields.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Filter
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreateDialogOpen ? createViewMutation.isPending : updateViewMutation.isPending}
              >
                {isCreateDialogOpen 
                  ? (createViewMutation.isPending ? 'Creating...' : 'Create View')
                  : (updateViewMutation.isPending ? 'Saving...' : 'Save Changes')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete View Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Custom View</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500">
              Are you sure you want to delete the <strong>{currentView?.name}</strong> view?
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentView(null);
                setIsDeleteDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteView}
              disabled={deleteViewMutation.isPending}
            >
              {deleteViewMutation.isPending ? 'Deleting...' : 'Delete View'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}