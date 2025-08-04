// src/pages/MembersDashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './MembersDashboard.css';

const MembersDashboard: React.FC = () => {
  return (
    <div className="members-dashboard">
      <h1>Welcome to the Members Dashboard</h1>
      <div className="dashboard-grid">
        <Link to="/members/profile" className="dashboard-card">
          <h2>Profile</h2>
          <p>View and update your profile information.</p>
        </Link>

        <Link to="/members/events" className="dashboard-card">
          <h2>Events</h2>
          <p>See upcoming performances and event details.</p>
        </Link>

        <Link to="/members/availability" className="dashboard-card">
          <h2>Availability</h2>
          <p>Set your availability for upcoming events.</p>
        </Link>

        <Link to="/members/resources" className="dashboard-card">
          <h2>Resources</h2>
          <p>Access sheet music and other materials.</p>
        </Link>

        <Link to="/members/settings" className="dashboard-card">
          <h2>Settings</h2>
          <p>Manage your account preferences.</p>
        </Link>

        <Link to="/admin" className="dashboard-card">
          <h2>Admin Panel</h2>
          <p>Manage members and events (Admins only).</p>
        </Link>
      </div>
    </div>
  );
};

export default MembersDashboard;
