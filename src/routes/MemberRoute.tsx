// =============================================
// FILE: src/routes/MemberRoute.tsx
// Guard: any authenticated user ("member")
// =============================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { User } from 'firebase/auth';

interface Props {
  user: User | null;
  children: React.ReactNode;
}

const MemberRoute: React.FC<Props> = ({ user, children }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};

export default MemberRoute;

