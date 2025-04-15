import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { 
  Check, 
  Circle, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  User, 
  Link2, 
  Calendar, 
  DollarSign, 
  PieChart, 
  ExternalLink,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DealStage, DealWithContact } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UserRole, useUserRole } from '@/hooks/use-user-role';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('all');
  
  // Fetch all stages
  const { data: stages = [] } = useQuery<DealStage[]>({
    queryKey: ['/api/deal-stages'],
  });
  
  // Handle stage change
  const handleStageChange = async (stageId: string) => {
    try {
      const newStageId = parseInt(stageId, 10);
      if (isNaN(newStageId) || newStageId === deal.stageId) return;
      
      await apiRequest('PUT', `/api/deals/${deal.id}`, { 
        stageId: newStageId 
      });
      
      // Create an activity for this stage change
      const stage = stages.find(s => s.id === newStageId);
      if (stage) {
        await apiRequest('POST', '/api/activities', {
          type: 'deal_update',
          description: `Deal moved to ${stage.name} stage`,
          dealId: deal.id,
          contactId: deal.contactId,
        });
      }
      
      // Refresh deals and activities data
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    } catch (error) {
      console.error('Failed to update deal stage:', error);
    }
  };
  
  // Format the value as currency
  const dealValue = typeof deal.value === 'number' ? deal.value : 0;
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(dealValue);

  // Format date
  const formattedDate = format(new Date(deal.createdAt), 'MMM dd, yyyy');

  // Get stage style based on stage name - matching the pipeline view colors
  const getStageStyle = (stageName: string) => {
    const stageStyleMap: Record<string, { color: string, bgColor: string }> = {
      'Lead': { color: 'white', bgColor: '#E73C37' },
      'Contacted': { color: 'white', bgColor: '#F37021' },
      'Recommend By QC': { color: 'white', bgColor: '#FAA21B' },
      'Call Scheduled': { color: 'white', bgColor: '#F8C300' },
      'Connected': { color: 'white', bgColor: '#DAED56' },
      'Engaged': { color: 'white', bgColor: '#97C93D' },
      'Proposal Sent': { color: 'white', bgColor: '#00A94F' },
      'WON': { color: 'white', bgColor: '#009444' },
      'Later Stage': { color: 'white', bgColor: '#0072BC' },
      'Recycled': { color: 'white', bgColor: '#2E3192' },
    };
    
    return stageStyleMap[stageName] || { color: 'white', bgColor: 'gray' };
  };
  
  const stageStyle = getStageStyle(deal.stage.name);
  const nextSteps = deal.nextSteps ? deal.nextSteps.split(',').map(step => step.trim()) : [];
  
  // Get first letter of name for avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Mock activities for the lead
  const activities = [
    { 
      id: 1, 
      type: 'email',
      description: 'Sent initial outreach email',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    },
    { 
      id: 2, 
      type: 'call',
      description: 'Scheduled a call for next week',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    { 
      id: 3, 
      type: 'note',
      description: 'Added contact information from LinkedIn',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl">{deal.name}</DialogTitle>
              <Badge 
                style={{ 
                  backgroundColor: stageStyle.bgColor, 
                  color: stageStyle.color,
                }}
              >
                {deal.stage.name}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <RoleBasedAccess allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onEdit}
                  className="flex items-center"
                >
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
              </RoleBasedAccess>
              <RoleBasedAccess allowedRoles={[UserRole.ADMIN]}>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex items-center"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </RoleBasedAccess>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex mt-2">
          <div className="w-2/3 pr-4">
            <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="logs">Call Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Input placeholder="Add comment" className="flex-grow" />
                  <Button size="sm">Send</Button>
                </div>
                
                <Card>
                  <CardContent className="pt-4">
                    {activities.length > 0 ? (
                      <div className="space-y-4">
                        {activities.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="text-sm font-medium">
                                  {activity.type === 'email' ? 'Email Sent' : 
                                   activity.type === 'call' ? 'Call Scheduled' : 'Note Added'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(activity.date, 'MMM d, yyyy')}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">
                                {activity.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-6">No activity yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="emails">
                <p className="text-center text-gray-500 py-10">No emails yet</p>
              </TabsContent>
              
              <TabsContent value="files">
                <p className="text-center text-gray-500 py-10">No files uploaded</p>
              </TabsContent>
              
              <TabsContent value="comments">
                <p className="text-center text-gray-500 py-10">No comments yet</p>
              </TabsContent>
              
              <TabsContent value="tasks">
                <div className="p-4 border rounded-md mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Tasks</h3>
                    <Button size="sm" variant="ghost">
                      <Plus className="h-4 w-4 mr-1" /> Add Task
                    </Button>
                  </div>
                  
                  {nextSteps.length > 0 ? (
                    <div className="space-y-2">
                      {nextSteps.map((step, index) => (
                        <div key={index} className="flex items-start">
                          <Checkbox className="mt-1 mr-2" />
                          <div>
                            <p className="text-sm">{step}</p>
                            <p className="text-xs text-gray-500">Due: {format(new Date(), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tasks yet</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="logs">
                <p className="text-center text-gray-500 py-10">No call logs yet</p>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="w-1/3 border-l pl-4">
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>Stage</span>
                <Badge 
                  style={{ 
                    backgroundColor: stageStyle.bgColor, 
                    color: stageStyle.color,
                  }}
                >
                  {deal.stage.name}
                </Badge>
              </h3>
              
              <Select 
                defaultValue={deal.stage.id.toString()} 
                onValueChange={handleStageChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.sort((a, b) => a.order - b.order).map(stage => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator className="my-4" />
            
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-4 flex justify-between items-center">
                <span>Custom Columns</span>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="text-sm">{deal.source || 'Not specified'}</p>
                </div>
                
                {deal.thread && (
                  <div>
                    <p className="text-xs text-gray-500">Thread</p>
                    <a 
                      href={deal.thread} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      {deal.thread.substring(0, 30)}...
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-gray-500">Next Steps</p>
                  <p className="text-sm">{deal.nextSteps || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Fit</p>
                  <p className="text-sm">{deal.fit || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Interest</p>
                  <p className="text-sm">{deal.interest || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="text-sm font-medium mb-4 flex justify-between items-center">
                <span>Contacts and organizations</span>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </h3>
              
              <div className="p-3 border rounded-md mb-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(deal.contact.name)}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium">{deal.contact.name}</p>
                      {deal.contact.email && <p className="text-xs text-gray-500">({deal.contact.email})</p>}
                    </div>
                    <p className="text-xs text-gray-500">{deal.contact.company}</p>
                  </div>
                </div>
                
                <div className="mt-2 space-y-1 pl-10">
                  {deal.contact.position && (
                    <p className="text-xs text-gray-600 flex items-center">
                      <User className="h-3 w-3 mr-1 text-gray-400" />
                      {deal.contact.position}
                    </p>
                  )}
                  
                  {deal.contact.email && (
                    <p className="text-xs text-gray-600 flex items-center">
                      <Mail className="h-3 w-3 mr-1 text-gray-400" />
                      {deal.contact.email}
                    </p>
                  )}
                  
                  {deal.contact.phone && (
                    <p className="text-xs text-gray-600 flex items-center">
                      <Phone className="h-3 w-3 mr-1 text-gray-400" />
                      {deal.contact.phone}
                    </p>
                  )}
                  
                  {deal.contact.linkedIn && (
                    <a 
                      href={deal.contact.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center"
                    >
                      <Link2 className="h-3 w-3 mr-1 text-gray-400" />
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealDetailDialog;
