import React, { useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Database, Layers, Eye } from 'lucide-react';
import StageManager from '@/components/settings/StageManager';
import CustomFieldManager from '@/components/settings/CustomFieldManager';
import ViewManager from '@/components/settings/ViewManager';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="pipeline">
          <TabsList className="w-full justify-start mb-8">
            <TabsTrigger value="pipeline" className="flex items-center">
              <Layers className="mr-2 h-4 w-4" /> 
              Pipeline Stages
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center">
              <Database className="mr-2 h-4 w-4" /> 
              Custom Fields
            </TabsTrigger>
            <TabsTrigger value="views" className="flex items-center">
              <Eye className="mr-2 h-4 w-4" /> 
              Custom Views
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pipeline">
            <StageManager />
          </TabsContent>
          
          <TabsContent value="fields">
            <CustomFieldManager />
          </TabsContent>

          <TabsContent value="views">
            <ViewManager />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}