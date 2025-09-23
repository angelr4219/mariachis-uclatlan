

// =============================================
// FILE: src/routes/AdminOnly.tsx
// Purpose: DRY helper to gate admin pages (Auth -> Admin -> AdminLayout)
// =============================================
import React from 'react';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AdminLayout from '../layouts/AdminLayout';


interface Props {
user: any; // Firebase User or null
isAdmin: boolean;
children: React.ReactNode;
}


const AdminOnly: React.FC<Props> = ({ user, isAdmin, children }) => (
<ProtectedRoute user={user}>
<AdminRoute isAdmin={isAdmin}>
<AdminLayout>{children}</AdminLayout>
</AdminRoute>
</ProtectedRoute>
);


export default AdminOnly;