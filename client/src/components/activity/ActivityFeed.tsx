import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { Mail, Check, Calendar, UserPlus, FileEdit } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityWithRelations } from '@shared/schema';

interface ActivityFeedProps {
  title?: string;
  contactId?: number;
  dealId?: number;
  limit?: number;
  showViewAll?: boolean;
  showEmpty?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title = "Recent Activity",
  contactId,
  dealId,
  limit,
  showViewAll = true,
  showEmpty = true,
}) => {
  // Build query params based on props
  const queryParams = new URLSearchParams();
  if (contactId) queryParams.append('contactId', contactId.toString());
  if (dealId) queryParams.append('dealId', dealId.toString());

  // Query activities
  const { data: activities = [], isLoading } = useQuery<ActivityWithRelations[]>({
    queryKey: [`/api/activities?${queryParams.toString()}`],
  });

  // Limit activities if specified
  const limitedActivities = limit ? activities.slice(0, limit) : activities;

  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    const iconClasses = "h-5 w-5 text-white";
    
    switch (type) {
      case 'email':
        return <Mail className={iconClasses} />;
      case 'deal_update':
        return <FileEdit className={iconClasses} />;
      case 'meeting':
        return <Calendar className={iconClasses} />;
      case 'contact_added':
        return <UserPlus className={iconClasses} />;
      default:
        return <Check className={iconClasses} />;
    }
  };

  // Get background color based on activity type
  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-500';
      case 'deal_update':
        return 'bg-purple-500';
      case 'meeting':
        return 'bg-yellow-500';
      case 'contact_added':
        return 'bg-indigo-500';
      default:
        return 'bg-green-500';
    }
  };

  // Format time ago
  const getTimeAgo = (date: Date | string) => {
    const activityDate = new Date(date);
    return formatDistanceToNow(activityDate, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        </CardHeader>
        <CardContent className="p-6 flex justify-center">
          <p>Loading activities...</p>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0 && showEmpty) {
    return (
      <Card className="shadow">
        <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <FileEdit className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">No recent activities</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        {showViewAll && activities.length > 0 && (
          <Button variant="link" className="text-primary hover:text-blue-700 text-sm font-medium p-0">
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="flow-root">
          <ul className="-mb-8">
            {limitedActivities.map((activity, index) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {index < limitedActivities.length - 1 && (
                    <span 
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" 
                      aria-hidden="true" 
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className={`h-8 w-8 rounded-full ${getActivityBgColor(activity.type)} flex items-center justify-center ring-8 ring-white`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-500">
                        {activity.contact && (
                          <a href={`/contacts/${activity.contact.id}`} className="font-medium text-gray-900">
                            {activity.contact.name}
                          </a>
                        )} 
                        {activity.description}
                        {activity.deal && (
                          <a href={`/deals/${activity.deal.id}`} className="font-medium text-gray-900">
                            {' ' + activity.deal.name}
                          </a>
                        )}
                        <span className="whitespace-nowrap ml-1">
                          {getTimeAgo(activity.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
