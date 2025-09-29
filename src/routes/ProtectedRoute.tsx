// =============================================
// FILE: src/routes/ProtectedRoute.tsx
// Purpose: Generic route guard for authenticated pages. Optionally checks
//          for administrative privileges when `requiresAdmin` is set.
// =============================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { User } from 'firebase/auth';

interface Props {
  user: User | null;
  children: React.ReactNode;
  /**
   * True if the current user has admin privileges.  You compute this
   * (e.g. in App.tsx) based on custom claims or a hard‑coded allowlist.
   */
  isAdminUser?: boolean;
  /**
   * If true, the route requires admin privileges.  Non‑admin users are
   * redirected to the home page (or wherever you prefer).
   */
  requiresAdmin?: boolean;
}

const ProtectedRoute: React.FC<Props> = ({ user, children, isAdminUser, requiresAdmin }) => {
  const location = useLocation();

  // If the user is not signed in, send them to the login page.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If admin privileges are required and the user is not an admin, redirect them.
  if (requiresAdmin && !isAdminUser) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the protected content.
  return <>{children}</>;
};

export default ProtectedRoute;
