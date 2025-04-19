
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DealWithContact } from '@shared/schema';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Filter, ChevronDown, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  }).reverse();

  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);

  // Fetch all deals
  const { data: deals = [], isLoading } = useQuery<DealWithContact[]>({
    queryKey: ['/api/deals'],
  });

  // Find the selected month object
  const selectedMonthObj = monthOptions.find(month => month.value === selectedMonth);

  // Filter and group deals by month
  const filteredDeals = selectedMonthObj
    ? deals
        .reduce((acc, deal) => {
          const dealDate = new Date(deal.createdAt);
          if (isWithinInterval(dealDate, {
            start: startOfMonth(selectedMonthObj.startDate),
            end: endOfMonth(selectedMonthObj.endDate)
          })) {
            acc.push(deal);
          }
          return acc;
        }, [] as DealWithContact[])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : deals;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Deals By Month</h1>
          
          <div className="flex gap-3">
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="w-[180px]">
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

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
              <div className="col-span-1"></div>
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Stage</div>
              <div className="col-span-4">Contacts and organizations</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className="px-4 py-2 hover:bg-gray-50">
                <div className="grid grid-cols-12 gap-4 items-center text-sm">
                  <div className="col-span-1">
                    <Checkbox />
                  </div>
                  <div className="col-span-4">{deal.name}</div>
                  <div className="col-span-3 flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: deal.stage?.color }}
                    />
                    {deal.stage?.name}
                  </div>
                  <div className="col-span-4">
                    {deal.contact?.name || deal.contact?.company || '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
