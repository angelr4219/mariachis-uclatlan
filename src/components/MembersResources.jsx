// src/pages/MembersResources.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './MembersOnly.css';

function MembersResources() {
  return (
    <div>
      <Navbar />
      <div className="sidebar">
        <h2>Member Tools</h2>
        <ul>
          <li><Link to="/members/profile">Your Profile</Link></li>
          <li><Link to="/members/events">Event Schedules</Link></li>
          <li><Link to="/members/resources">Exclusive Resources</Link></li>
          <li><Link to="/members/community">Community Forum</Link></li>
          <li><Link to="/members/settings">Account Settings</Link></li>
        </ul>
      </div>
      <div className="main-content">
        <h1>Exclusive Resources</h1>
        <ul>
          <li><strong>🎼 Sheet Music Library:</strong> Download music PDFs for all instrument sections.</li>
          <li><strong>📅 Event Calendar:</strong> View all upcoming rehearsals and performances.</li>
          <li><strong>✅ Attendance Tracker:</strong> Track participation and engagement.</li>
          <li><strong>🎽 Uniform Policy:</strong> Guidelines for proper attire during performances.</li>
          <li><strong>📝 Performance Agreements:</strong> Templates for external gigs including weddings and community events.</li>
          <li><strong>📘 Member Handbook / Constitution:</strong> Details on expectations, leadership roles, auditions, and organizational structure.</li>
          <li><strong>💸 Reimbursement Forms:</strong> Submit expenses for travel, uniforms, and gear.</li>
          <li><strong>🧑‍🤝‍🧑 Member Directory:</strong> View private profiles with instrument, year, and contact info (opt-in only).</li>
        </ul>

        <h2>🗂️ Member Information Extraction</h2>
        <p>
          Member information is now collected directly through the registration process. To view or update your details, please visit the <Link to="/register">Register</Link> page.
        </p>
      </div>
    </div>
  );
}

export default MembersResources;
