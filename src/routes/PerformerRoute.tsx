
// =============================================
// FILE: src/routes/PerformerRoute.tsx
// Guard: user must have role 'performer' (or admin)
// =============================================
import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  isPerformer: boolean;
  isAdmin?: boolean; // allow admins through by default
  children: React.ReactNode;
}

const PerformerRoute: React.FC<Props> = ({ isPerformer, isAdmin = false, children }) => {
  if (!(isPerformer || isAdmin)) return <Navigate to="/members" replace />;
  return <>{children}</>;
};

export default PerformerRoute;


