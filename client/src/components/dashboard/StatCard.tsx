import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs last month'
}) => {
  const isPositive = change >= 0;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {value}
            </dd>
          </dl>
        </div>
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm flex items-center">
            <span className={`font-medium flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="ml-2 text-gray-500">
              {changeLabel}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
