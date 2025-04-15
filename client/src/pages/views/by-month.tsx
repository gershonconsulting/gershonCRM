import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DealWithContact } from '@shared/schema';
import MainLayout from '@/layouts/MainLayout';
import PipelineView from '@/components/pipeline/PipelineView';
import { Button } from '@/components/ui/button';
import { Filter, CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function ByMonth() {
  // Create month options for the last 12 months
  const monthOptions = Array.from({ length: 13 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy'),
      startDate: startOfMonth(date),
      endDate: endOfMonth(date)
    };
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);

  // Fetch all deals
  const { data: deals = [], isLoading } = useQuery<DealWithContact[]>({
    queryKey: ['/api/deals'],
  });

  // Find the selected month object
  const selectedMonthObj = monthOptions.find(month => month.value === selectedMonth);

  // Filter deals by creation month
  const filteredDeals = selectedMonthObj
    ? deals.filter(deal => {
        const dealDate = new Date(deal.createdAt);
        return isWithinInterval(dealDate, {
          start: selectedMonthObj.startDate,
          end: selectedMonthObj.endDate
        });
      })
    : deals;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Deals By Creation Month</h1>

          <div className="flex gap-3">
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="w-[180px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filter
            </Button>
          </div>
        </div>

        <div className="mb-6 bg-white rounded-md p-4 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">
            <p>Showing <span className="font-semibold">{filteredDeals.length}</span> deals created in <span className="font-semibold">{selectedMonthObj?.label}</span></p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <PipelineView filteredDeals={filteredDeals} />
        )}
      </div>
    </MainLayout>
  );
}