
// ===============================
// FILE: src/components/AdminNavbar.tsx (updated)
// ===============================
import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminNavbar.css';

const AdminNavbar: React.FC = () => {
  return (
    <nav className="admin-navbar" role="navigation" aria-label="Admin Navigation Bar">
      <div className="admin-brand">Admin Portal</div>
      <button
        className="admin-menu-toggle"
        aria-label="Toggle menu"
        onClick={() => {
          const el = document.querySelector('.admin-links');
          el?.classList.toggle('open');
        }}
      >
        ☰
      </button>
      <ul className="admin-links">
        <li>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/events" className={({ isActive }) => (isActive ? 'active' : '')}>
            Events
          </NavLink>
        </li>
        <li>
          {/* unified route name to match App.tsx */}
          <NavLink to="/admin/managemembers" className={({ isActive }) => (isActive ? 'active' : '')}>
            Manage Members
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
            Reports
          </NavLink>
        </li>
        <li>
          <NavLink to="/members/performer-availability" className={({ isActive }) => (isActive ? 'active' : '')}>
            Availability
          </NavLink>
        </li>
        <li className="divider" aria-hidden>
          │
        </li>
        <li>
          <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
            Public Site
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default AdminNavbar;
