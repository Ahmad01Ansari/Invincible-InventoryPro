import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force users to setup a new password strictly
  if (user?.isTemporaryPassword) {
    return <Navigate to="/setup-password" replace />;
  }

  if (requiredPermission && user) {
    const hasPermission =
      user.role === 'super_admin' ||
      user.role === 'company_owner' ||
      user.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
