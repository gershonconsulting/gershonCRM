import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart4, TrendingUp, DollarSign, Users } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DealWithContact } from '@shared/schema';
import { format, parseISO, isThisMonth, isSameMonth, subMonths } from 'date-fns';

// Import Recharts components
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard: React.FC = () => {
  // Fetch dashboard stats
  const { data: stats = { activeDeals: 0, pipelineValue: 0, winRate: 0, newContacts: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch all deals for analytics
  const { data: deals = [], isLoading: dealsLoading } = useQuery<DealWithContact[]>({
    queryKey: ['/api/deals'],
  });

  // Format currency 
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate deals by stage for pie chart
  const dealsByStage = React.useMemo(() => {
    const stageMap: Record<string, number> = {};
    
    deals.forEach(deal => {
      const stageName = deal.stage.name;
      stageMap[stageName] = (stageMap[stageName] || 0) + 1;
    });
    
    return Object.entries(stageMap).map(([name, value]) => ({ name, value }));
  }, [deals]);

  // Calculate deals by month for bar chart
  const dealsByMonth = React.useMemo(() => {
    const monthlyDeals: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'MMM yyyy');
      monthlyDeals[monthKey] = 0;
    }
    
    // Count deals per month
    deals.forEach(deal => {
      const dealDate = new Date(deal.createdAt);
      
      // Only count deals from the last 6 months
      for (let i = 0; i <= 5; i++) {
        const monthDate = subMonths(now, i);
        if (isSameMonth(dealDate, monthDate)) {
          const monthKey = format(monthDate, 'MMM yyyy');
          monthlyDeals[monthKey]++;
          break;
        }
      }
    });
    
    // Convert to array for Recharts
    return Object.entries(monthlyDeals).map(([month, count]) => ({
      month,
      count
    }));
  }, [deals]);

  // Calculate pipeline value by stage
  const pipelineByStage = React.useMemo(() => {
    const stageMap: Record<string, number> = {};
    
    deals.forEach(deal => {
      const stageName = deal.stage.name;
      stageMap[stageName] = (stageMap[stageName] || 0) + (deal.value || 0);
    });
    
    return Object.entries(stageMap).map(([name, value]) => ({ name, value }));
  }, [deals]);

  // Calculate average deal size
  const averageDealSize = React.useMemo(() => {
    if (deals.length === 0) return 0;
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    return totalValue / deals.length;
  }, [deals]);

  // COLORS for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FE1B04', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c'];

  // Loading state
  const isLoading = statsLoading || dealsLoading;

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                  <BarChart4 className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeDeals}</div>
                  <p className="text-xs text-gray-500">
                    {dealsByMonth.length > 0 && `+${dealsByMonth[dealsByMonth.length - 1].count} this month`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.pipelineValue)}</div>
                  <p className="text-xs text-gray-500">Avg: {formatCurrency(averageDealSize)}/deal</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.winRate}%</div>
                  <p className="text-xs text-gray-500">Based on closed deals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{deals.length}</div>
                  <p className="text-xs text-gray-500">
                    {dealsByMonth.length > 0 && `+${dealsByMonth[dealsByMonth.length - 1].count} this month`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Deals by Stage */}
              <Card>
                <CardHeader>
                  <CardTitle>Deals by Stage</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dealsByStage}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {dealsByStage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value} deals`, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Deals by Month */}
              <Card>
                <CardHeader>
                  <CardTitle>Leads by Month</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dealsByMonth}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} leads`]} />
                        <Legend />
                        <Bar dataKey="count" name="New Leads" fill="#FE1B04" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pipeline Value by Stage */}
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Value by Stage</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={pipelineByStage}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" 
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value as number), "Value"]}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Pipeline Value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;