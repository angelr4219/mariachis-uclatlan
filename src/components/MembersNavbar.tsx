// src/components/MemberNavbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './MembersNavbar.css';

const MemberNavbar: React.FC = () => {
  return (
    <nav className="member-navbar">
      <div className="member-brand">Members Portal</div>
      <ul className="member-links">
        <li><Link to="/members">Dashboard</Link></li>
        <li><Link to="/members/profile">Profile</Link></li>
        <li><Link to="/members/events">Events</Link></li>
        <li><Link to="/members/resources">Resources</Link></li>
        <li><Link to="/members/settings">Settings</Link></li>
        <li><Link to="/">Public Site</Link></li>
      </ul>
    </nav>
  );
};

export default MemberNavbar;
