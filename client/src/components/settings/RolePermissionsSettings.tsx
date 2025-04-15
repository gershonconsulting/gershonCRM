import React from "react";
import { UserRole, useUserRole } from "@/hooks/use-user-role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import RoleBasedAccess from "@/components/auth/RoleBasedAccess";

// Define permissions for each role
const rolePermissions = [
  { feature: "View Dashboard", client: true, manager: true, admin: true },
  { feature: "View Reports", client: false, manager: true, admin: true },
  { feature: "Edit Reports", client: false, manager: false, admin: true },
  { feature: "View Contacts", client: true, manager: true, admin: true },
  { feature: "Add/Edit Contacts", client: false, manager: true, admin: true },
  { feature: "Delete Contacts", client: false, manager: false, admin: true },
  { feature: "View Deals", client: true, manager: true, admin: true },
  { feature: "Add/Edit Deals", client: false, manager: true, admin: true },
  { feature: "Delete Deals", client: false, manager: false, admin: true },
  { feature: "Change Pipeline Stages", client: false, manager: false, admin: true },
  { feature: "Access Settings", client: false, manager: false, admin: true },
  { feature: "Manage Users", client: false, manager: false, admin: true },
  { feature: "View All Data", client: false, manager: true, admin: true },
  { feature: "Export Data", client: false, manager: true, admin: true },
  { feature: "Import Data", client: false, manager: false, admin: true },
];

const userAssignments = [
  { name: "Zachary", role: UserRole.CLIENT },
  { name: "Vincent", role: UserRole.CLIENT },
  { name: "Joseph", role: UserRole.MANAGER },
  { name: "Aina", role: UserRole.MANAGER },
  { name: "Winnie", role: UserRole.MANAGER },
  { name: "Olivier", role: UserRole.ADMIN },
];

// Role badge colors
const roleColors: Record<UserRole, string> = {
  [UserRole.CLIENT]: "bg-blue-100 text-blue-800 border-blue-200",
  [UserRole.MANAGER]: "bg-green-100 text-green-800 border-green-200",
  [UserRole.ADMIN]: "bg-purple-100 text-purple-800 border-purple-200"
};

const RolePermissionsSettings: React.FC = () => {
  const { role } = useUserRole();

  return (
    <div className="space-y-8">
      <RoleBasedAccess
        allowedRoles={[UserRole.ADMIN]}
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Permission Settings</CardTitle>
              <CardDescription>
                You don't have access to view or change permission settings. 
                Please contact an administrator for assistance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Your current role: {role && (
                <Badge className={roleColors[role]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
              )}</p>
            </CardContent>
          </Card>
        }
      >
        {/* Only admins can see this content */}
        <div>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>User Role Assignments</CardTitle>
              <CardDescription>
                Users are assigned specific roles that determine their access level in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAssignments.map((user) => (
                      <TableRow key={user.name}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role]}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Each role has specific permissions that control what users can view and modify
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Feature/Action</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rolePermissions.map((permission) => (
                      <TableRow key={permission.feature}>
                        <TableCell className="font-medium">{permission.feature}</TableCell>
                        <TableCell>
                          {permission.client ? 
                            <Check className="h-5 w-5 text-green-500" /> : 
                            <X className="h-5 w-5 text-red-500" />}
                        </TableCell>
                        <TableCell>
                          {permission.manager ? 
                            <Check className="h-5 w-5 text-green-500" /> : 
                            <X className="h-5 w-5 text-red-500" />}
                        </TableCell>
                        <TableCell>
                          {permission.admin ? 
                            <Check className="h-5 w-5 text-green-500" /> : 
                            <X className="h-5 w-5 text-red-500" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleBasedAccess>
    </div>
  );
};

export default RolePermissionsSettings;