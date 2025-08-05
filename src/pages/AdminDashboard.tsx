import React from 'react';
import RoleAssigner from '../components/RoleAssigner';
import ManageEvents from '../components/ManageEvents'; // Adjusted path
import MembersList from '../components/MembersList'; // Adjusted path
import { useUserProfile } from '../context/UserProfileContext'; // Ensure this path is correct

const AdminDashBoard: React.FC = () => {
  const { profile } = useUserProfile();
  

  if (profile?.role !== 'admin') {
    return <p>You do not have permission to access the Admin Dashboard.</p>;
  }

  return (
    <section className="admin-dashboard" style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

      <div className="dashboard-section" style={{ marginBottom: '3rem' }}>
        <h2>🔑 Role Management</h2>
        <p>Assign or update user roles (Admin, Performer).</p>
        <RoleAssigner />
      </div>

      <div className="dashboard-section" style={{ marginBottom: '3rem' }}>
        <h2>📅 Manage Events</h2>
        <p>Add, edit, or delete upcoming events.</p>
        <ManageEvents />
      </div>

      <div className="dashboard-section" style={{ marginBottom: '3rem' }}>
        <h2>👥 Members Overview</h2>
        <p>View registered members, their instruments, and availability status.</p>
        <MembersList />
      </div>

      <div className="dashboard-section" style={{ marginBottom: '3rem' }}>
        <h2>📊 Dashboard Summary</h2>
        <ul>
          <li>Total Members: (Fetch from Firestore)</li>
          <li>Total Admins: (Fetch from Firestore)</li>
          <li>Upcoming Events: (Fetch count from /events)</li>
        </ul>
      </div>
    </section>
  );
};

export default AdminDashBoard;
