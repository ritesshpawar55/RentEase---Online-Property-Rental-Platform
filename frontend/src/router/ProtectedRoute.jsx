import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Route protection wrapper based on authentication state and roles.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const location = useLocation();

  // If not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is restricted and doesn't match, redirect to homepage
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}
