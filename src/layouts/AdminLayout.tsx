

// =============================================
// FILE: src/layouts/AdminLayout.tsx
// Purpose: Render Admin header ONCE and an Outlet for all admin pages
// =============================================
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../adminComponents/adminNavbar';


const AdminLayout: React.FC = () => {
return (
<div className="admin-shell">
<AdminNavbar />
<div className="admin-content">
<Outlet />
</div>
</div>
);
};


export default AdminLayout;