// src/components/Admin/AdminDashboard.tsx
import React from 'react';
import AdminNavbar from './adminNavbar';  // Adjust path if needed

const AdminDashboard: React.FC = () => {
  return (
    <>
      <AdminNavbar />

      <div style={{ padding: '2rem' }}>
        <h1>Admin Dashboard</h1>
        <p>Welcome to the Admin Dashboard. Here you can manage members, assign roles, and oversee events.</p>
      </div>
    </>
  );
};

export default AdminDashboard;