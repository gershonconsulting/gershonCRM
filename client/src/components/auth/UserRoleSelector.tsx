import React from "react";
import { useUserRole, UserRole } from "@/hooks/use-user-role";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const userOptions = [
  { name: "Zachary", role: UserRole.CLIENT },
  { name: "Vincent", role: UserRole.CLIENT },
  { name: "Joseph", role: UserRole.MANAGER },
  { name: "Aina", role: UserRole.MANAGER },
  { name: "Winnie", role: UserRole.MANAGER },
  { name: "Olivier", role: UserRole.ADMIN }
];

const roleColors: Record<UserRole, string> = {
  [UserRole.CLIENT]: "bg-blue-100 text-blue-800 border-blue-200",
  [UserRole.MANAGER]: "bg-green-100 text-green-800 border-green-200",
  [UserRole.ADMIN]: "bg-purple-100 text-purple-800 border-purple-200"
};

const UserRoleSelector: React.FC = () => {
  const { setCurrentUser, role, username } = useUserRole();

  const handleUserChange = (selectedUsername: string) => {
    const selectedUser = userOptions.find(u => u.name.toLowerCase() === selectedUsername.toLowerCase());
    if (selectedUser) {
      // In a real app, we would get the user data from the backend
      // Here we're simulating by creating a mock user object
      setCurrentUser({
        id: 1,
        username: selectedUser.name.toLowerCase(),
        email: `${selectedUser.name.toLowerCase()}@example.com`,
        role: selectedUser.role,
        password: "",
        firstName: selectedUser.name,
        lastName: "",
        isActive: true,
        createdAt: new Date(),
        lastLogin: null,
        company: null,
        position: null
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">User:</span>
      <Select
        value={username?.toLowerCase() || ""}
        onValueChange={handleUserChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          {userOptions.map((user) => (
            <SelectItem key={user.name.toLowerCase()} value={user.name.toLowerCase()}>
              <div className="flex items-center justify-between w-full">
                <span>{user.name}</span>
                <Badge className={`ml-2 ${roleColors[user.role]}`}>
                  {user.role}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {role && (
        <Badge className={`${roleColors[role]}`}>
          {role}
        </Badge>
      )}
    </div>
  );
};

export default UserRoleSelector;