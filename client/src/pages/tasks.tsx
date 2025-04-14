import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, Filter, Calendar, Clock, Circle, CheckCircle } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { TaskWithRelations, Contact, Deal } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertTaskSchema } from '@shared/schema';

// Task form schema

// Task form schema
const taskFormSchema = insertTaskSchema.extend({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  contactId: z.number().optional().nullable(),
  dealId: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  completed: z.boolean().default(false),
});

const TasksPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const { toast } = useToast();

  // Form setup
  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      contactId: null,
      dealId: null,
      dueDate: null,
      completed: false,
    },
  });

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ['/api/tasks'],
  });

  // Fetch contacts for the dropdown
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Fetch deals for the dropdown
  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
  });

  // Filter tasks by tab and search query
  const filteredTasks = tasks.filter(task => {
    // Filter by tab
    if (selectedTab === 'upcoming' && task.completed) return false;
    if (selectedTab === 'completed' && !task.completed) return false;
    
    // Filter by search query
    if (searchQuery) {
      const taskTitle = task.title.toLowerCase();
      const contactName = task.contact?.name.toLowerCase() || '';
      const dealName = task.deal?.name.toLowerCase() || '';
      
      return (
        taskTitle.includes(searchQuery.toLowerCase()) ||
        contactName.includes(searchQuery.toLowerCase()) ||
        dealName.includes(searchQuery.toLowerCase())
      );
    }
    
    return true;
  });

  // Task due date badge
  const getTaskDueBadge = (dueDate: Date | null | undefined) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = dueDate.toDateString() === today.toDateString();
    const isTomorrow = dueDate.toDateString() === tomorrow.toDateString();
    const isPast = dueDate < today;
    
    if (isToday) {
      return <Badge variant="destructive">Today</Badge>;
    } else if (isTomorrow) {
      return <Badge variant="warning">Tomorrow</Badge>;
    } else if (isPast) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="info">Upcoming</Badge>;
    }
  };

  // Toggle task completion
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      return apiRequest('PUT', `/api/tasks/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update task: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Create/Update task
  const taskMutation = useMutation({
    mutationFn: async (values: z.infer<typeof taskFormSchema>) => {
      if (selectedTask) {
        return apiRequest('PUT', `/api/tasks/${selectedTask.id}`, values);
      } else {
        return apiRequest('POST', `/api/tasks`, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: selectedTask ? "Task updated" : "Task created",
        description: selectedTask ? "Task has been updated successfully." : "New task has been created.",
      });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${selectedTask ? 'update' : 'create'} task: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Open task form for editing
  const openEditForm = (task: TaskWithRelations) => {
    setSelectedTask(task);
    form.reset({
      title: task.title,
      contactId: task.contactId || null,
      dealId: task.dealId || null,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd\'T\'HH:mm') : null,
      completed: task.completed,
    });
    setIsFormOpen(true);
  };

  // Open task form for creating
  const openCreateForm = () => {
    setSelectedTask(null);
    form.reset({
      title: '',
      contactId: null,
      dealId: null,
      dueDate: null,
      completed: false,
    });
    setIsFormOpen(true);
  };

  // Submit task form
  const onSubmit = (values: z.infer<typeof taskFormSchema>) => {
    taskMutation.mutate(values);
  };

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Tasks
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 sm:items-center">
          <div className="relative max-w-md w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-3">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id.toString()}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Tabs and Tasks List */}
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                  <TabsTrigger value="all">All Tasks</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <p>Loading tasks...</p>
                </div>
              ) : filteredTasks.length > 0 ? (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`p-4 border rounded-lg ${task.completed ? 'bg-gray-50' : 'bg-white'}`}
                      onClick={() => openEditForm(task)}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={(checked) => {
                              toggleTaskMutation.mutate({ 
                                id: task.id, 
                                completed: !!checked 
                              });
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </h3>
                            {task.dueDate && getTaskDueBadge(new Date(task.dueDate))}
                          </div>
                          
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            {task.contact && (
                              <div className="flex items-center">
                                <Circle className="h-3 w-3 mr-1 text-blue-500" />
                                {task.contact.name}
                              </div>
                            )}
                            
                            {task.deal && (
                              <div className="flex items-center">
                                <Circle className="h-3 w-3 mr-1 text-purple-500" />
                                {task.deal.name}
                              </div>
                            )}
                            
                            {task.dueDate && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                {format(new Date(task.dueDate), 'MMM d, yyyy')}
                              </div>
                            )}
                            
                            {task.dueDate && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                {format(new Date(task.dueDate), 'h:mm a')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-sm mb-4">
                    {searchQuery 
                      ? `No tasks found matching "${searchQuery}"` 
                      : selectedTab === 'completed' 
                        ? "No completed tasks yet" 
                        : "No tasks yet"}
                  </p>
                  <Button onClick={openCreateForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Contact</FormLabel>
                        <Select
                          onValueChange={(value) => 
                            field.onChange(value ? parseInt(value) : null)
                          }
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id.toString()}>
                                {contact.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dealId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Deal</FormLabel>
                        <Select
                          onValueChange={(value) => 
                            field.onChange(value ? parseInt(value) : null)
                          }
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select deal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {deals.map((deal) => (
                              <SelectItem key={deal.id} value={deal.id.toString()}>
                                {deal.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="completed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Mark as completed
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={taskMutation.isPending}>
                    {taskMutation.isPending
                      ? "Saving..."
                      : selectedTask
                      ? "Update Task"
                      : "Create Task"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default TasksPage;
