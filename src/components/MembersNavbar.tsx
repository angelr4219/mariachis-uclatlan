// src/components/MemberNavbar.tsx
import React from 'react';
import './MembersNavbar.css';

const MembersNavbar: React.FC = () => {
  return (
    <nav className="member-navbar">
      <div className="member-brand">Members Portal</div>
      <ul className="member-links">
        <li><a href="/members">Dashboard</a></li>
        <li><a href="/">Public Site</a></li>
      </ul>
    </nav>
  );
};

export default MembersNavbar;
