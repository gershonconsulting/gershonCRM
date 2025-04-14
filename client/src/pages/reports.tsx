import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon, BarChart2, TrendingUp } from 'lucide-react';

// Sample data - Replace with actual data when available
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

const monthlyData = [
  { name: 'Jan', contacts: 0, deals: 0 },
  { name: 'Feb', contacts: 0, deals: 0 },
  { name: 'Mar', contacts: 0, deals: 0 },
  { name: 'Apr', contacts: 0, deals: 0 },
  { name: 'May', contacts: 0, deals: 0 },
  { name: 'Jun', contacts: 0, deals: 0 },
];

export default function Reports() {
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
            <TabsTrigger value="activity" className="flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              Activity
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
                      <BarChart data={stageData} layout="vertical">
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
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Pipeline Value</p>
                      <p className="text-2xl font-bold">$0</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Win Rate</p>
                      <p className="text-2xl font-bold">0%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Avg. Deal Size</p>
                      <p className="text-2xl font-bold">$0</p>
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
                      <Bar dataKey="contacts" name="New Contacts" fill="var(--primary)" />
                      <Bar dataKey="deals" name="New Deals" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Summary of activities performed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10">
                  <p className="text-gray-500">No activity data available yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}