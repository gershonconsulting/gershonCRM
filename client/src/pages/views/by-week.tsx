import React from 'react';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export default function ByWeek() {
  // Generate data for the last 4 weeks
  const weeks = Array.from({ length: 4 }).map((_, i) => {
    const date = subWeeks(new Date(), i);
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    return {
      id: i,
      label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} Weeks Ago`,
      dateRange: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
      count: 0
    };
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Contacts by Week</h1>
          <Button>Add Contact</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {weeks.map((week) => (
            <Card key={week.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  {week.label}
                </CardTitle>
                <CardDescription>{week.dateRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{week.count}</p>
                <p className="text-sm text-gray-500">new contacts</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">All Contacts</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <p className="text-gray-500">No contacts found</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}