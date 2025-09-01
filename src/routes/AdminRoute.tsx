// src/routes/AdminRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';


interface Props {
isAdmin: boolean;
children: React.ReactNode;
}


const AdminRoute: React.FC<Props> = ({ isAdmin, children }) => {
if (!isAdmin) return <Navigate to="/members" replace />;
return <>{children}</>;
};


export default AdminRoute;