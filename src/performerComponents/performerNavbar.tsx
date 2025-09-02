// =============================================
// FILE: src/components/PerformerNavbar.tsx
// Description: Performer navbar with proper member routes + active link styles
// =============================================
import React from 'react';
import { NavLink } from 'react-router-dom';
import './performerNavbar.css';


const PerformerNavbar: React.FC = () => {
const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : undefined);
return (
<nav className="member-navbar">
<div className="member-brand">Performer Portal</div>
<ul className="member-links">
<li><NavLink to="/dashboard" className={cls}>Dashboard</NavLink></li>
<li><NavLink to="/members/profile" className={cls}>Profile</NavLink></li>
<li><NavLink to="/members/events" className={cls}>Events</NavLink></li>
<li><NavLink to="/members/calendar" className={cls}>Calendar</NavLink></li>
<li><NavLink to="/members/performer-availability" className={cls}>Availability</NavLink></li>
<li><NavLink to="/members/resources" className={cls}>Resources</NavLink></li>
<li><NavLink to="/members/settings" className={cls}>Settings</NavLink></li>
<li><NavLink to="/" className={cls}>Public Site</NavLink></li>
</ul>
</nav>
);
};


export default PerformerNavbar;