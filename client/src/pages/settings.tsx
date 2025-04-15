import React, { useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Database, Layers, Eye, Upload, Users, Shield } from 'lucide-react';
import StageManager from '@/components/settings/StageManager';
import CustomFieldManager from '@/components/settings/CustomFieldManager';
import ViewManager from '@/components/settings/ViewManager';
import ImportData from '@/components/settings/ImportData';
import RolePermissionsSettings from '@/components/settings/RolePermissionsSettings';
import { UserRole, useUserRole } from '@/hooks/use-user-role';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';

export default function SettingsPage() {
  const { role } = useUserRole();
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="pipeline">
          <TabsList className="w-full justify-start mb-8">
            <RoleBasedAccess allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
              <TabsTrigger value="pipeline" className="flex items-center">
                <Layers className="mr-2 h-4 w-4" /> 
                Pipeline Stages
              </TabsTrigger>
            </RoleBasedAccess>
            
            <RoleBasedAccess allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
              <TabsTrigger value="fields" className="flex items-center">
                <Database className="mr-2 h-4 w-4" /> 
                Custom Fields
              </TabsTrigger>
            </RoleBasedAccess>
            
            <TabsTrigger value="views" className="flex items-center">
              <Eye className="mr-2 h-4 w-4" /> 
              Custom Views
            </TabsTrigger>
            
            <RoleBasedAccess allowedRoles={[UserRole.ADMIN]}>
              <TabsTrigger value="import" className="flex items-center">
                <Upload className="mr-2 h-4 w-4" /> 
                Import Data
              </TabsTrigger>
            </RoleBasedAccess>
            
            <RoleBasedAccess allowedRoles={[UserRole.ADMIN]}>
              <TabsTrigger value="permissions" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" /> 
                Roles & Permissions
              </TabsTrigger>
            </RoleBasedAccess>
          </TabsList>
          
          <TabsContent value="pipeline">
            <RoleBasedAccess
              allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}
              fallback={<AccessDeniedMessage feature="Pipeline Settings" />}
            >
              <StageManager />
            </RoleBasedAccess>
          </TabsContent>
          
          <TabsContent value="fields">
            <RoleBasedAccess
              allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}
              fallback={<AccessDeniedMessage feature="Custom Fields" />}
            >
              <CustomFieldManager />
            </RoleBasedAccess>
          </TabsContent>

          <TabsContent value="views">
            <ViewManager />
          </TabsContent>

          <TabsContent value="import">
            <RoleBasedAccess
              allowedRoles={[UserRole.ADMIN]}
              fallback={<AccessDeniedMessage feature="Data Import" />}
            >
              <ImportData />
            </RoleBasedAccess>
          </TabsContent>
          
          <TabsContent value="permissions">
            <RolePermissionsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// Component to show when user doesn't have access to a feature
const AccessDeniedMessage = ({ feature }: { feature: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>Access Denied</CardTitle>
      <CardDescription>
        You don't have permission to access {feature}.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p>Please contact an administrator if you need access to this feature.</p>
    </CardContent>
  </Card>
);