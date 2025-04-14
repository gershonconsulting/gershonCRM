import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Plus, Edit2, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DealStage } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function StageManager() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState<DealStage | null>(null);
  const [stageName, setStageName] = useState('');
  const [stageProbability, setStageProbability] = useState('0');
  const [stageColor, setStageColor] = useState('#3498db');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Fetch stages
  const { data: stages, isLoading } = useQuery<DealStage[]>({
    queryKey: ['/api/deal-stages'],
  });

  // Create stage mutation
  const createStageMutation = useMutation({
    mutationFn: async (newStage: { name: string; probability: number; color: string }) => {
      return apiRequest('/api/deal-stages', {
        method: 'POST',
        body: JSON.stringify(newStage),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deal-stages'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Stage created',
        description: 'The pipeline stage was successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create stage: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: async (stage: { id: number; name: string; probability: number; color: string }) => {
      return apiRequest(`/api/deal-stages/${stage.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: stage.name,
          probability: stage.probability,
          color: stage.color,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deal-stages'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: 'Stage updated',
        description: 'The pipeline stage was successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update stage: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete stage mutation
  const deleteStageMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/deal-stages/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deal-stages'] });
      setIsDeleteDialogOpen(false);
      setCurrentStage(null);
      toast({
        title: 'Stage deleted',
        description: 'The pipeline stage was successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete stage: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Reorder stage mutation
  const reorderStageMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: 'up' | 'down' }) => {
      return apiRequest(`/api/deal-stages/${id}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ direction }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deal-stages'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to reorder stages: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    createStageMutation.mutate({
      name: stageName,
      probability: parseInt(stageProbability, 10),
      color: stageColor,
    });
  };

  const handleUpdateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStage) return;

    updateStageMutation.mutate({
      id: currentStage.id,
      name: stageName,
      probability: parseInt(stageProbability, 10),
      color: stageColor,
    });
  };

  const handleDeleteStage = () => {
    if (!currentStage) return;
    deleteStageMutation.mutate(currentStage.id);
  };

  const resetForm = () => {
    setStageName('');
    setStageProbability('0');
    setStageColor('#3498db');
    setCurrentStage(null);
    setShowColorPicker(false);
  };

  const openEditDialog = (stage: DealStage) => {
    setCurrentStage(stage);
    setStageName(stage.name);
    setStageProbability(stage.probability.toString());
    setStageColor(stage.color);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (stage: DealStage) => {
    setCurrentStage(stage);
    setIsDeleteDialogOpen(true);
  };

  const moveStage = (id: number, direction: 'up' | 'down') => {
    reorderStageMutation.mutate({ id, direction });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pipeline Stages</CardTitle>
          <CardDescription>Manage your sales pipeline stages</CardDescription>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stage
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md" />
            ))}
          </div>
        ) : stages && stages.length > 0 ? (
          <div className="space-y-2">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex items-center justify-between p-3 border rounded-md group hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div>
                    <div className="font-medium">{stage.name}</div>
                    <div className="text-sm text-gray-500">
                      Win probability: {stage.probability}%
                      {stage.count !== null && ` • ${stage.count} deals`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="outline" onClick={() => moveStage(stage.id, 'up')}>
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => moveStage(stage.id, 'down')}>
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => openEditDialog(stage)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => openDeleteDialog(stage)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No stages found. Create your first pipeline stage.</p>
          </div>
        )}
      </CardContent>

      {/* Create Stage Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Pipeline Stage</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateStage}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Stage Name</Label>
                <Input
                  id="name"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  placeholder="e.g., Qualified Lead"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="probability">Win Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={stageProbability}
                  onChange={(e) => setStageProbability(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Stage Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-md cursor-pointer border"
                    style={{ backgroundColor: stageColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                  <Input
                    value={stageColor}
                    onChange={(e) => setStageColor(e.target.value)}
                    placeholder="#hex"
                    required
                  />
                </div>
                {showColorPicker && (
                  <div className="absolute z-10 mt-2">
                    <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                    <div className="relative">
                      <div 
                        className="p-3 bg-white rounded-md shadow-lg border"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="grid grid-cols-10 gap-1">
                          {[
                            '#e74c3c', '#e67e22', '#f39c12', '#f1c40f', 
                            '#2ecc71', '#27ae60', '#3498db', '#2980b9', 
                            '#8e44ad', '#9b59b6', '#1abc9c', '#16a085',
                            '#95a5a6', '#7f8c8d', '#34495e', '#2c3e50',
                            '#000000', '#333333', '#666666', '#999999'
                          ].map(color => (
                            <div
                              key={color}
                              className="w-6 h-6 rounded-sm cursor-pointer hover:scale-110 transition-transform border"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                setStageColor(color);
                                setShowColorPicker(false);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              <Button type="submit" disabled={createStageMutation.isPending}>
                {createStageMutation.isPending ? 'Creating...' : 'Create Stage'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Pipeline Stage</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStage}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Stage Name</Label>
                <Input
                  id="name"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  placeholder="e.g., Qualified Lead"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="probability">Win Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={stageProbability}
                  onChange={(e) => setStageProbability(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Stage Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-md cursor-pointer border"
                    style={{ backgroundColor: stageColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                  <Input
                    value={stageColor}
                    onChange={(e) => setStageColor(e.target.value)}
                    placeholder="#hex"
                    required
                  />
                </div>
                {showColorPicker && (
                  <div className="absolute z-10 mt-2">
                    <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                    <div className="relative">
                      <div 
                        className="p-3 bg-white rounded-md shadow-lg border"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="grid grid-cols-10 gap-1">
                          {[
                            '#e74c3c', '#e67e22', '#f39c12', '#f1c40f', 
                            '#2ecc71', '#27ae60', '#3498db', '#2980b9', 
                            '#8e44ad', '#9b59b6', '#1abc9c', '#16a085',
                            '#95a5a6', '#7f8c8d', '#34495e', '#2c3e50',
                            '#000000', '#333333', '#666666', '#999999'
                          ].map(color => (
                            <div
                              key={color}
                              className="w-6 h-6 rounded-sm cursor-pointer hover:scale-110 transition-transform border"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                setStageColor(color);
                                setShowColorPicker(false);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              <Button type="submit" disabled={updateStageMutation.isPending}>
                {updateStageMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Stage Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Pipeline Stage</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500">
              Are you sure you want to delete the <strong>{currentStage?.name}</strong> stage?
              {currentStage?.count && currentStage.count > 0 ? (
                <span className="text-red-500 block mt-2">
                  Warning: This stage contains {currentStage.count} deals. Deleting this stage will
                  remove these deals from your pipeline.
                </span>
              ) : null}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentStage(null);
                setIsDeleteDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStage}
              disabled={deleteStageMutation.isPending}
            >
              {deleteStageMutation.isPending ? 'Deleting...' : 'Delete Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}