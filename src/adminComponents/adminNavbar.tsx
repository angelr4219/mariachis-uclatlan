// src/components/AdminNavbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../components/MembersNavbar.css';  // ✅ Correct relative path to components folder


const AdminNavbar: React.FC = () => {
  return (
    <nav className="member-navbar">
      <div className="member-brand">Admin Portal</div>
      <ul className="member-links">
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/members/profile">Profile</Link></li>
        {/* 🔄 Replace with Admin Events route */}
        <li><Link to="/admin/events">Events</Link></li>
        <li><Link to="/members/resources">Resources</Link></li>
        <li><Link to="/members/settings">Settings</Link></li>
        <li><Link to="/members/performer-availability">Availability</Link></li>
        <li><Link to="/admin">Admin Panel</Link></li>
        <li><Link to="/members/manage">Manage Members</Link></li>
        <li><Link to="/">Public Site</Link></li>
      </ul>
    </nav>
  );
};

export default AdminNavbar;
