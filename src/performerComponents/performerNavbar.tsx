// Example for PerformerNavbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './performerNavbar.css';  // <== This will now resolve correctly


const PerformerNavbar: React.FC = () => {
    return (
      <nav className="member-navbar">
        <div className="member-brand">Performer Portal</div>
        <ul className="member-links">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/members/profile">Profile</Link></li>
          <li><Link to="/members/events">Events</Link></li>
          <li><Link to="/members/resources">Resources</Link></li>
          <li><Link to="/members/settings">Settings</Link></li>
          <li><Link to="/members/performer-availability">Availability</Link></li>
          <li><Link to="/">Public Site</Link></li>
        </ul>
      </nav>
    );
  };
  
  export default PerformerNavbar;