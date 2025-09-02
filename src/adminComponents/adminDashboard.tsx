
// ================================================
// FILE: src/components/Admin/AdminDashboard.tsx
// ================================================
import React from 'react';


const AdminDashboard: React.FC = () => {
  return (
    <>

      <div className="admin-page">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage members, assign roles, and oversee events.</p>
        </header>
        <section className="admin-grid">
          <a className="admin-card" href="/admin/events">
            <h3>Events</h3>
            <p>Create, publish, and manage upcoming events.</p>
          </a>
          <a className="admin-card" href="/admin/members">
            <h3>Manage Members</h3>
            <p>Search members and assign roles.</p>
          </a>
          <a className="admin-card" href="/admin/reports">
            <h3>Reports</h3>
            <p>Export availability summaries (CSV/PDF).</p>
          </a>
        </section>
      </div>
    </>
  );
};

export default AdminDashboard;