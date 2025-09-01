// src/layouts/AdminLayout.tsx
import React from 'react';
import AdminNavbar from '../adminComponents/adminNavbar';


const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
return (
<>
<AdminNavbar />
<main className="ucla-container">{children}</main>
</>
);
};


export default AdminLayout;