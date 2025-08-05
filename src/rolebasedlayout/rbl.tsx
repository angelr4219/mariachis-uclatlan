import React, { useState } from 'react';
import AdminNavbar from '../adminComponents/adminNavbar';
import MembersNavbar from '../components/MembersNavbar';  // <-- Use MembersNavbar here
import Navbar from '../components/Navbar';  // Public Navbar

interface RoleBasedLayoutProps {
  adminComponent: React.ReactNode;
  performerComponent: React.ReactNode;
  publicComponent: React.ReactNode;
}

const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({ adminComponent, performerComponent, publicComponent }) => {
  const [role, setRole] = useState<'admin' | 'performer' | 'public'>('public');

  const handleToggle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value as 'admin' | 'performer' | 'public';
    setRole(selectedRole);
  };

  return (
    <>
      <div style={{ padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <label style={{ marginRight: '0.5rem' }}>Select Role View:</label>
        <select value={role} onChange={handleToggle}>
          <option value="public">Public</option>
          <option value="performer">Performer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {role === 'admin' && <AdminNavbar />}
      {role === 'performer' && <MembersNavbar />}  {/* <-- Use MembersNavbar here */}
      {role === 'public' && <Navbar />}

      <main>
        {role === 'admin' && adminComponent}
        {role === 'performer' && performerComponent}
        {role === 'public' && publicComponent}
      </main>
    </>
  );
};

export default RoleBasedLayout;
