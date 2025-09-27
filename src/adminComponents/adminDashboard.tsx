
// =============================================
// FILE: src/components/Admin/AdminDashboard.tsx
// Purpose: Use RELATIVE NavLink targets so nesting works
// =============================================
import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage members, assign roles, and oversee events.</p>
      </header>
      <section className="admin-grid">
        <NavLink className="admin-card" to="events">
          <h3>Events</h3>
          <p>Create, publish, and manage upcoming events.</p>
        </NavLink>
        <NavLink className="admin-card" to="managemembers">
          <h3>Manage Members</h3>
          <p>Search members and assign roles.</p>
        </NavLink>
        <NavLink className="admin-card" to="reports">
          <h3>Reports</h3>
          <p>Export availability summaries (CSV/PDF).</p>
        </NavLink>
        <NavLink className="admin-card" to="inquiries">
          <h3>Requests</h3>
          <p>Accept/decline Hire Us inquiries → events.</p>
        </NavLink>
        <NavLink className="admin-card" to="participation">
          <h3>Participation</h3>
          <p>Event participation summaries.</p>
        </NavLink>
      </section>
    </div>
  );
};

export default AdminDashboard;
