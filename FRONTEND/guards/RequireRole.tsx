import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';

/**
 * Client-side Route Guard for Power House & Public Portals.
 *
 * NOTE: Client-side route guards provide UX scoping and interface separation only.
 * Real access control must be strictly enforced server-side (JWT role claims,
 * session cookies, Row Level Security in Postgres/CloudSQL, and scoped API gateways).
 * Never store secrets (SMS gateway tokens, Telegram bot tokens, DLT keys) in frontend client code.
 */
interface RequireRoleProps {
  requiredRole: 'operator' | 'public';
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ requiredRole, children }) => {
  const role = useSessionStore((s) => s.role);
  const isPreviewMode = useSessionStore((s) => s.isPreviewMode);
  const location = useLocation();

  // If user is public and trying to access operator powerhouse routes, redirect to public home
  if (requiredRole === 'operator' && role === 'public' && !isPreviewMode) {
    return <Navigate to="/colony" replace />;
  }

  return <>{children}</>;
};
