import React, { ReactNode } from "react";
import { UserRole, useUserRole } from "@/hooks/use-user-role";

interface RoleBasedAccessProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders its children based on the user's role
 * 
 * @param allowedRoles - Array of roles that are allowed to view the content
 * @param children - The content to render if the user has permission
 * @param fallback - Optional content to render if the user doesn't have permission
 */
const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null
}) => {
  const { role, hasAccess } = useUserRole();
  
  // If no role is set, don't render anything
  if (!role) return null;
  
  // Check if user's role is in the allowed roles
  const hasPermission = allowedRoles.some(allowedRole => hasAccess(allowedRole));
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default RoleBasedAccess;