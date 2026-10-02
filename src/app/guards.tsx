import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { UserRole } from '../domain/types';

interface RoleGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRole, children }) => {
  const role = useSessionStore((s) => s.role);

  // If role does not match, allow smooth transition by updating role or redirecting to /
  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
