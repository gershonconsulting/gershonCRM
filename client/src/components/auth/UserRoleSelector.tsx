import React from "react";
import { UserRole, useUserRole } from "@/hooks/use-user-role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User } from "@shared/schema";

// Role badge colors
const roleColors: Record<UserRole, string> = {
  [UserRole.CLIENT]: "bg-blue-100 text-blue-800 border-blue-200",
  [UserRole.MANAGER]: "bg-green-100 text-green-800 border-green-200",
  [UserRole.ADMIN]: "bg-purple-100 text-purple-800 border-purple-200"
};

// Sample users for the demonstration
const usersByRole: Record<UserRole, string[]> = {
  [UserRole.CLIENT]: ["Zachary", "Vincent"],
  [UserRole.MANAGER]: ["Joseph", "Aina", "Winnie"],
  [UserRole.ADMIN]: ["Olivier"]
};

const UserRoleSelector: React.FC = () => {
  const { role, setCurrentUser } = useUserRole();

  const handleRoleChange = (newRole: string) => {
    const userRole = newRole as UserRole;
    // Create a minimal user object with the selected role
    const user = {
      id: 1,
      username: usersByRole[userRole][0], // Use the first user of that role
    } as User;
    
    setCurrentUser(user);
  };

  const handleUserChange = (username: string) => {
    if (!role) return;
    
    // Create a minimal user object with the selected username but same role
    const user = {
      id: 1,
      username,
    } as User;
    
    setCurrentUser(user);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Role Simulation</CardTitle>
        <CardDescription>
          Change your role to test different permission levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Current Role:</p>
          {role && (
            <Badge className={roleColors[role]}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Switch Role:</p>
          <Select onValueChange={handleRoleChange} value={role || undefined}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Available Roles</SelectLabel>
                <SelectItem value={UserRole.CLIENT}>Client</SelectItem>
                <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {role && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Switch User:</p>
            <Select 
              onValueChange={handleUserChange} 
              defaultValue={usersByRole[role][0]}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Users</SelectLabel>
                  {usersByRole[role].map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserRoleSelector;