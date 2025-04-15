import React from "react";
import { useUserRole, UserRole } from "@/hooks/use-user-role";

interface RoleBasedAccessProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 * 
 * @param children - Content to show if user has access
 * @param allowedRoles - Array of roles that are allowed to access the children
 * @param fallback - Optional content to show if user does not have access
 */
const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  children,
  allowedRoles,
  fallback = null
}) => {
  const { role } = useUserRole();
  
  if (!role) {
    return <>{fallback}</>;
  }
  
  const hasRequiredRole = allowedRoles.some(requiredRole => {
    if (requiredRole === UserRole.CLIENT) {
      return true; // All roles have client access
    } else if (requiredRole === UserRole.MANAGER) {
      return role === UserRole.MANAGER || role === UserRole.ADMIN;
    } else if (requiredRole === UserRole.ADMIN) {
      return role === UserRole.ADMIN;
    }
    return false;
  });
  
  return <>{hasRequiredRole ? children : fallback}</>;
};

export default RoleBasedAccess;