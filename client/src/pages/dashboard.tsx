import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart4, TrendingUp, DollarSign, Users, Brain, Target, Clock, BarChart2, PercentIcon, Activity } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DealWithContact } from '@shared/schema';
import { format, parseISO, isThisMonth, isSameMonth, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth, compareDesc } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  Area,
  AreaChart,
  ComposedChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const Dashboard: React.FC = () => {
  // Define dashboard stats type
  interface DashboardStats {
    activeDeals: number;
    pipelineValue: number;
    winRate: number;
    newContacts: number;
  }

  // Fetch dashboard stats
  const { data: stats = { activeDeals: 0, pipelineValue: 0, winRate: 0, newContacts: 0 }, isLoading: statsLoading } = useQuery<DashboardStats>({
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

  // Calculate median deal size (often a more reliable metric than average)
  const medianDealSize = React.useMemo(() => {
    if (deals.length === 0) return 0;
    
    // Extract values and sort them
    const values = deals
      .map(deal => deal.value || 0)
      .sort((a, b) => a - b);
    
    // Find median
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid];
  }, [deals]);

  // Calculate sales velocity metrics
  const salesVelocity = React.useMemo(() => {
    // Number of deals
    const numDeals = deals.length;
    
    // Average deal size (already calculated)
    
    // Win rate (already in stats)
    
    // Average sales cycle (in days)
    const salesCycles = deals
      .filter(deal => deal.closedAt !== null) // Only consider closed deals
      .map(deal => {
        const createdDate = new Date(deal.createdAt);
        const closedDate = deal.closedAt ? new Date(deal.closedAt) : new Date();
        return Math.ceil((closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      });
    
    const avgSalesCycle = salesCycles.length > 0 
      ? salesCycles.reduce((sum, days) => sum + days, 0) / salesCycles.length 
      : 0;
    
    // Calculate sales velocity
    const velocity = numDeals * averageDealSize * (stats.winRate / 100) / (avgSalesCycle || 1);
    
    return {
      avgSalesCycle: Math.round(avgSalesCycle),
      velocity: Math.round(velocity)
    };
  }, [deals, averageDealSize, stats]);

  // Calculate value by company interest
  const valueByInterest = React.useMemo(() => {
    const interestMap: Record<string, { count: number, value: number }> = {};
    
    deals.forEach(deal => {
      // If interest field is not set, categorize as "Unspecified"
      const interest = deal.interest || "Unspecified";
      
      if (!interestMap[interest]) {
        interestMap[interest] = { count: 0, value: 0 };
      }
      
      interestMap[interest].count++;
      interestMap[interest].value += deal.value || 0;
    });
    
    return Object.entries(interestMap).map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value,
      avgValue: data.count > 0 ? data.value / data.count : 0
    }));
  }, [deals]);

  // Calculate value by company fit
  const valueByFit = React.useMemo(() => {
    const fitMap: Record<string, { count: number, value: number }> = {};
    
    deals.forEach(deal => {
      // If fit field is not set, categorize as "Unspecified"
      const fit = deal.fit || "Unspecified";
      
      if (!fitMap[fit]) {
        fitMap[fit] = { count: 0, value: 0 };
      }
      
      fitMap[fit].count++;
      fitMap[fit].value += deal.value || 0;
    });
    
    return Object.entries(fitMap).map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value,
      avgValue: data.count > 0 ? data.value / data.count : 0
    }));
  }, [deals]);

  // Generate Insightful Metrics for Data Analysis Card
  const dataAnalysis = React.useMemo(() => {
    // 1. Top performing stage by conversion rate
    const stageConversion: Record<string, { inCount: number, outCount: number }> = {};
    
    deals.forEach(deal => {
      const stageName = deal.stage.name;
      
      if (!stageConversion[stageName]) {
        stageConversion[stageName] = { inCount: 0, outCount: 0 };
      }
      
      stageConversion[stageName].inCount++;
      
      // Consider a deal as "converted" if it's moved to a later stage
      // This is approximate since we don't have actual flow data
      if (deal.stage.order < 8) { // Assuming WON is near the end
        stageConversion[stageName].outCount++;
      }
    });
    
    const conversionRates = Object.entries(stageConversion).map(([name, data]) => ({
      name,
      rate: data.inCount > 0 ? (data.outCount / data.inCount) * 100 : 0
    }));
    
    const topStage = conversionRates.length > 0 
      ? conversionRates.reduce((prev, current) => (current.rate > prev.rate) ? current : prev)
      : { name: "N/A", rate: 0 };
    
    // 2. Month with highest deal creation
    const monthWithMostDeals = dealsByMonth.reduce(
      (prev, current) => (current.count > prev.count) ? current : prev,
      { month: "N/A", count: 0 }
    );
    
    // 3. Average deal value growth over time
    const dealValuesByMonth: Record<string, { total: number, count: number }> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'MMM yyyy');
      dealValuesByMonth[monthKey] = { total: 0, count: 0 };
    }
    
    // Sum deal values by month
    deals.forEach(deal => {
      const dealDate = new Date(deal.createdAt);
      
      // Only include deals from the last 6 months
      for (let i = 0; i <= 5; i++) {
        const monthDate = subMonths(now, i);
        if (isSameMonth(dealDate, monthDate)) {
          const monthKey = format(monthDate, 'MMM yyyy');
          dealValuesByMonth[monthKey].total += deal.value || 0;
          dealValuesByMonth[monthKey].count++;
          break;
        }
      }
    });
    
    // Calculate average value per month and growth rate
    const avgValueByMonth = Object.entries(dealValuesByMonth).map(([month, data]) => ({
      month,
      avgValue: data.count > 0 ? data.total / data.count : 0
    }));
    
    let growthRate = 0;
    if (avgValueByMonth.length >= 2) {
      const firstMonth = avgValueByMonth[0].avgValue;
      const lastMonth = avgValueByMonth[avgValueByMonth.length - 1].avgValue;
      
      if (firstMonth > 0) {
        growthRate = ((lastMonth - firstMonth) / firstMonth) * 100;
      }
    }
    
    // 4. Deals requiring attention (those stuck in a stage for long time)
    const stuckDeals = deals
      .filter(deal => deal.daysInStage && deal.daysInStage > 30) // Arbitrary threshold, could be calibrated
      .length;
    
    return {
      topPerformingStage: topStage.name,
      topStageConversionRate: Math.round(topStage.rate),
      peakMonth: monthWithMostDeals.month,
      peakMonthCount: monthWithMostDeals.count,
      dealValueGrowthRate: Math.round(growthRate),
      stuckDeals
    };
  }, [deals, dealsByMonth]);

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

            {/* AI Analysis Section */}
            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center">
                <div>
                  <CardTitle className="text-lg font-bold">Pipeline Intelligence</CardTitle>
                  <CardDescription>Advanced metrics and data analysis from your pipeline data</CardDescription>
                </div>
                <Brain className="h-8 w-8 ml-auto text-primary opacity-80" />
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="insights">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="insights" className="flex-1">Key Insights</TabsTrigger>
                    <TabsTrigger value="metrics" className="flex-1">Advanced Metrics</TabsTrigger>
                    <TabsTrigger value="recommendations" className="flex-1">Recommendations</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="insights" className="p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Top Performing Stage</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">{dataAnalysis.topPerformingStage}</div>
                          <p className="text-xs text-gray-500">
                            {dataAnalysis.topStageConversionRate}% conversion rate
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Peak Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">{dataAnalysis.peakMonth}</div>
                          <p className="text-xs text-gray-500">
                            {dataAnalysis.peakMonthCount} new leads
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Deals Needing Attention</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">{dataAnalysis.stuckDeals}</div>
                          <p className="text-xs text-gray-500">
                            Stuck for over 30 days
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Deal Value Growth</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">{dataAnalysis.dealValueGrowthRate}%</div>
                          <p className="text-xs text-gray-500">
                            Over last 6 months
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Avg. Deal Size</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">{formatCurrency(averageDealSize)}</div>
                          <p className="text-xs text-gray-500">
                            Median: {formatCurrency(medianDealSize)}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold">{formatCurrency(salesVelocity.velocity)}/day</div>
                          <p className="text-xs text-gray-500">
                            {salesVelocity.avgSalesCycle} days avg. cycle
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="metrics" className="p-1">
                    <div className="grid grid-cols-1 gap-4">
                      <Alert className="bg-blue-50 border-blue-200">
                        <Activity className="h-4 w-4" />
                        <AlertTitle>Enriched Pipeline Metrics</AlertTitle>
                        <AlertDescription>
                          These advanced metrics are calculated based on your historical pipeline data to provide deeper business insights.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Value by Company Interest</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="p-4 max-h-80 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2">Interest</th>
                                    <th className="text-right py-2">Count</th>
                                    <th className="text-right py-2">Total Value</th>
                                    <th className="text-right py-2">Avg Value</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {valueByInterest.map(item => (
                                    <tr key={item.category} className="border-b border-gray-100">
                                      <td className="py-2">{item.category}</td>
                                      <td className="text-right">{item.count}</td>
                                      <td className="text-right">{formatCurrency(item.value)}</td>
                                      <td className="text-right">{formatCurrency(item.avgValue)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Value by Company Fit</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="p-4 max-h-80 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2">Fit</th>
                                    <th className="text-right py-2">Count</th>
                                    <th className="text-right py-2">Total Value</th>
                                    <th className="text-right py-2">Avg Value</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {valueByFit.map(item => (
                                    <tr key={item.category} className="border-b border-gray-100">
                                      <td className="py-2">{item.category}</td>
                                      <td className="text-right">{item.count}</td>
                                      <td className="text-right">{formatCurrency(item.value)}</td>
                                      <td className="text-right">{formatCurrency(item.avgValue)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="recommendations" className="p-1">
                    <Alert className="bg-primary/5 border border-primary/20 mb-4">
                      <Brain className="h-5 w-5 text-primary" />
                      <AlertTitle>Data-Driven Recommendations</AlertTitle>
                      <AlertDescription>
                        These recommendations are generated based on analysis of your CRM data patterns.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      {dataAnalysis.stuckDeals > 0 && (
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium flex items-center">
                            <Target className="h-4 w-4 mr-2 text-amber-500" />
                            Focus on deals in stagnant stages
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {dataAnalysis.stuckDeals} deals have been in the same stage for over 30 days. Consider reviewing these deals to identify bottlenecks in your sales process.
                          </p>
                        </div>
                      )}
                      
                      {valueByInterest.length > 0 && (
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium flex items-center">
                            <BarChart2 className="h-4 w-4 mr-2 text-indigo-500" />
                            Optimize your interest targeting
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {valueByInterest.sort((a, b) => b.avgValue - a.avgValue)[0]?.category} companies show the highest average deal value. Consider focusing more resources on this segment.
                          </p>
                        </div>
                      )}
                      
                      {salesVelocity.avgSalesCycle > 0 && (
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            Reduce sales cycle time
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Your average sales cycle is {salesVelocity.avgSalesCycle} days. Finding ways to reduce this by even 10% could significantly increase your sales velocity and revenue.
                          </p>
                        </div>
                      )}
                      
                      {dataAnalysis.peakMonth && (
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                            Seasonal planning insights
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {dataAnalysis.peakMonth} was your strongest month with {dataAnalysis.peakMonthCount} new leads. Consider allocating more resources during this period to maximize results.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

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
              
              {/* Sales Velocity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Deal Value Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={valueByInterest.slice(0, 8)} // Limit to top 8 for readability
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip formatter={(value, name) => {
                          if (name === "Total Value") return [formatCurrency(value as number), name];
                          return [value, name];
                        }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="count" name="Deal Count" fill="#8884d8" />
                        <Line yAxisId="right" type="monotone" dataKey="avgValue" name="Avg Value" stroke="#82ca9d" />
                      </ComposedChart>
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