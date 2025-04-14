import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { User, Clock, Plus, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TaskWithRelations } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TaskListProps {
  title?: string;
  contactId?: number;
  dealId?: number;
  limit?: number;
  showViewAll?: boolean;
  onNewTask?: () => void;
}

const TaskList: React.FC<TaskListProps> = ({
  title = "Upcoming Tasks",
  contactId,
  dealId,
  limit,
  showViewAll = true,
  onNewTask,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Build query params based on props
  const queryParams = new URLSearchParams();
  if (contactId) queryParams.append('contactId', contactId.toString());
  if (dealId) queryParams.append('dealId', dealId.toString());
  
  // Query tasks
  const { data: tasks = [], isLoading } = useQuery<TaskWithRelations[]>({
    queryKey: [`/api/tasks?${queryParams.toString()}`],
  });
  
  // Limit tasks if specified
  const limitedTasks = limit ? tasks.slice(0, limit) : tasks;
  
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
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update task: ${error}`,
        variant: "destructive",
      });
    }
  });

  const handleToggleTask = (task: TaskWithRelations) => {
    toggleTaskMutation.mutate({ id: task.id, completed: !task.completed });
  };

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
      return <Badge variant="info">This week</Badge>;
    }
  };

  return (
    <Card className="shadow">
      <CardHeader className="px-4 py-5 sm:px-6 flex flex-row justify-between items-center border-b">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        <div className="flex space-x-2">
          {showViewAll && (
            <Button variant="link" className="text-primary hover:text-blue-700 text-sm font-medium p-0">
              View All
            </Button>
          )}
          {onNewTask && (
            <Button size="sm" onClick={onNewTask}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <p>Loading tasks...</p>
          </div>
        ) : limitedTasks.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {limitedTasks.map((task) => (
              <li key={task.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Checkbox 
                      id={`task-${task.id}`} 
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task)}
                    />
                    <label 
                      htmlFor={`task-${task.id}`} 
                      className={`ml-3 block text-sm font-medium ${
                        task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </label>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    {task.dueDate && getTaskDueBadge(new Date(task.dueDate))}
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    {task.contact && (
                      <p className="flex items-center text-sm text-gray-500">
                        <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {task.contact.name}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {format(new Date(task.dueDate), 'h:mm a')}
                        {task.dueDate && 
                          ` (${format(new Date(task.dueDate), 'MMM d')})`}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm mb-4">No tasks to display</p>
            {onNewTask && (
              <Button onClick={onNewTask} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskList;
