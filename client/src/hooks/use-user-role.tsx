import { createContext, ReactNode, useContext, useState } from "react";
import { User } from "@shared/schema";

// Define role-based access levels
export enum UserRole {
  CLIENT = "client",
  MANAGER = "manager",
  ADMIN = "admin"
}

// Define specific users and their roles
const USER_ROLES = {
  "zachary": UserRole.CLIENT,
  "vincent": UserRole.CLIENT,
  "joseph": UserRole.MANAGER,
  "aina": UserRole.MANAGER,
  "winnie": UserRole.MANAGER,
  "olivier": UserRole.ADMIN
};

// Context to hold user role information
type UserRoleContextType = {
  role: UserRole | null;
  username: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isClient: boolean;
  hasAccess: (requiredRole: UserRole) => boolean;
  setCurrentUser: (user: User | null) => void;
};

export const UserRoleContext = createContext<UserRoleContextType | null>(null);

// Map a username to a role
const getUserRole = (username: string): UserRole => {
  const lowerUsername = username.toLowerCase();
  return USER_ROLES[lowerUsername as keyof typeof USER_ROLES] || UserRole.CLIENT;
};

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Function to set the current user and determine their role
  const setCurrentUser = (user: User | null) => {
    if (!user) {
      setRole(null);
      setUsername(null);
      return;
    }
    
    const userRole = getUserRole(user.username);
    setRole(userRole);
    setUsername(user.username);
  };

  // Check if user has the required role or higher
  const hasAccess = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    
    switch (requiredRole) {
      case UserRole.CLIENT:
        return true; // All roles have client-level access
      case UserRole.MANAGER:
        return role === UserRole.MANAGER || role === UserRole.ADMIN;
      case UserRole.ADMIN:
        return role === UserRole.ADMIN;
      default:
        return false;
    }
  };

  return (
    <UserRoleContext.Provider
      value={{
        role,
        username,
        isAdmin: role === UserRole.ADMIN,
        isManager: role === UserRole.MANAGER || role === UserRole.ADMIN,
        isClient: role === UserRole.CLIENT || role === UserRole.MANAGER || role === UserRole.ADMIN,
        hasAccess,
        setCurrentUser
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
}