import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine } from 'recharts';
import { PieChart as PieChartIcon, BarChart2, TrendingUp, CalendarDays } from 'lucide-react';
import { Deal, DealStage } from '@shared/schema';

// Sample data structure to be replaced with API data
const stageData = [
  { name: 'Lead', value: 0 },
  { name: 'Contacted', value: 0 },
  { name: 'Recommend By QC', value: 0 },
  { name: 'Call Scheduled', value: 0 },
  { name: 'Connected', value: 0 },
  { name: 'Engaged', value: 0 },
  { name: 'Proposal Sent', value: 0 },
  { name: 'WON', value: 0 },
  { name: 'Later Stage', value: 0 },
  { name: 'Recycled', value: 0 },
];

// Generate last 12 months for display
const generateMonthlyLabels = () => {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      name: d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear().toString().substr(-2),
      date: d,
      leads: 0,
      contacts: 0,
      deals: 0
    });
  }
  return months;
};

export default function Reports() {
  const [stagesData, setStagesData] = useState(stageData);
  const [monthlyData, setMonthlyData] = useState(generateMonthlyLabels());
  const [avgLeadsPerMonth, setAvgLeadsPerMonth] = useState(0);
  
  // Fetch stages data
  const { data: stages = [] } = useQuery<DealStage[]>({
    queryKey: ['/api/deal-stages'],
  });
  
  // Fetch deals data
  const { data: deals = [] } = useQuery<any[]>({
    queryKey: ['/api/deals'],
  });

  useEffect(() => {
    if (stages.length > 0) {
      // Map stages to counts
      const updatedStageData = stages.map(stage => ({
        name: stage.name,
        value: stage.count || 0
      }));
      setStagesData(updatedStageData);
    }
  }, [stages]);

  useEffect(() => {
    if (deals.length > 0) {
      const monthlyStats = [...monthlyData];
      
      // Count deals by month created
      deals.forEach(deal => {
        if (deal.createdAt) {
          const dealDate = new Date(deal.createdAt);
          const monthIndex = monthlyStats.findIndex(m => 
            m.date.getMonth() === dealDate.getMonth() && 
            m.date.getFullYear() === dealDate.getFullYear()
          );
          
          if (monthIndex !== -1) {
            // Increment total deals
            monthlyStats[monthIndex].deals += 1;
            
            // Count leads (deals in "Lead" stage)
            if (deal.stage && deal.stage.name === 'Lead') {
              monthlyStats[monthIndex].leads += 1;
            }
            
            // Count new contacts created
            if (deal.contactId) {
              monthlyStats[monthIndex].contacts += 1;
            }
          }
        }
      });
      
      setMonthlyData(monthlyStats);
      
      // Calculate average leads per month
      const totalLeads = monthlyStats.reduce((sum, month) => sum + month.leads, 0);
      const avgLeads = totalLeads / monthlyStats.length;
      setAvgLeadsPerMonth(Math.round(avgLeads * 10) / 10); // Round to 1 decimal place
    }
  }, [deals]);

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Reports</h1>
        
        <Tabs defaultValue="pipeline">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6">
            <TabsTrigger value="pipeline" className="flex items-center">
              <PieChartIcon className="mr-2 h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Growth
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4" />
              Leads
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pipeline">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Pipeline by Stage</CardTitle>
                  <CardDescription>Distribution of deals across pipeline stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stagesData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="var(--primary)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Summary</CardTitle>
                  <CardDescription>Key metrics overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Active Deals</p>
                      <p className="text-2xl font-bold">{deals.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Pipeline Value</p>
                      <p className="text-2xl font-bold">
                        ${deals.reduce((sum, deal) => sum + (deal.value || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Win Rate</p>
                      <p className="text-2xl font-bold">
                        {deals.length ? 
                          Math.round((deals.filter(d => d.stage?.name === 'WON').length / deals.length) * 100) : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Avg. Deal Size</p>
                      <p className="text-2xl font-bold">
                        ${deals.length ? 
                          Math.round(deals.reduce((sum, deal) => sum + (deal.value || 0), 0) / deals.length).toLocaleString() : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="growth">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Monthly contacts and deals added</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="contacts" name="New Contacts" fill="var(--primary)" />
                      <Bar dataKey="deals" name="New Deals" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leads">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>New Leads by Month</CardTitle>
                  <CardDescription>Monthly lead acquisition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}`, 'Leads']} />
                        <Legend />
                        <ReferenceLine y={avgLeadsPerMonth} label="Average" stroke="red" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="leads" stroke="#FF5630" activeDot={{ r: 8 }} name="New Leads" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Lead Generation Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Leads per Month</p>
                      <p className="text-3xl font-bold text-blue-600">{avgLeadsPerMonth}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Current Month Leads</p>
                      <p className="text-2xl font-bold">
                        {monthlyData[monthlyData.length - 1]?.leads || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Leads (12 months)</p>
                      <p className="text-2xl font-bold">
                        {monthlyData.reduce((sum, month) => sum + month.leads, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Best Month</p>
                      <p className="text-2xl font-bold">
                        {monthlyData.reduce((best, month) => 
                          month.leads > best.leads ? month : best, { name: 'None', leads: 0 }).name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}