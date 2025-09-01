import React from 'react';
import { Link } from 'react-router-dom';
import './MembersNavbar.css';

const MembersNavbar: React.FC = () => {
  return (
    <nav className="member-navbar">
      <div className="member-brand">
        <Link to="/members"> Members Portal</Link>
      </div>
      <ul className="member-links">
        {/* Member Core */}
        <li><Link to="/members/profile">Profile</Link></li>
        <li><Link to="/admin/events">Events</Link></li>
        <li><Link to="/members/calendar">Calendar</Link></li>
        <li><Link to="/members/resources">Resources</Link></li>
        <li><Link to="/members/performer-availability">Availability</Link></li>
        <li><Link to="/members/settings">Settings</Link></li>

        {/* Divider for dashboards */}
        <li className="divider"></li>
        <li><Link to="/performer-dashboard">Performer Dashboard</Link></li>
        <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>

        {/* Management */}
        <li><Link to="/members/manage">Manage Members</Link></li>

        {/* Back to public site */}
        <li><Link to="/">← Public Site</Link></li>
      </ul>
    </nav>
  );
};

export default MembersNavbar;
