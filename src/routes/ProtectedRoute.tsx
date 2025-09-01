// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { User } from 'firebase/auth'; 


interface Props {
user: User | null;
children: React.ReactNode;
}


const ProtectedRoute: React.FC<Props> = ({ user, children }) => {
const location = useLocation();
if (!user) {
return <Navigate to="/login" replace state={{ from: location }} />;
}
return <>{children}</>;
};


export default ProtectedRoute;