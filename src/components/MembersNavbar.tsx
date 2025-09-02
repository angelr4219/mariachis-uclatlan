

// =============================================
// FILE: src/components/MembersNavbar.tsx
// Description: Members navbar fixed to route to /members/events (not /admin/events)
// =============================================
import React from 'react';
import { NavLink } from 'react-router-dom';
import './MembersNavbar.css';


const MembersNavbar: React.FC = () => {
const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : undefined);
return (
<nav className="member-navbar">
<div className="member-brand">
<NavLink to="/members" className={cls}>Members Portal</NavLink>
</div>
<ul className="member-links">
{/* Member core */}
<li><NavLink to="/members/profile" className={cls}>Profile</NavLink></li>
<li><NavLink to="/members/events" className={cls}>Events</NavLink></li>
<li><NavLink to="/members/calendar" className={cls}>Calendar</NavLink></li>
<li><NavLink to="/members/performer-availability" className={cls}>Availability</NavLink></li>
<li><NavLink to="/members/resources" className={cls}>Resources</NavLink></li>
<li><NavLink to="/members/settings" className={cls}>Settings</NavLink></li>


{/* Divider for dashboards */}
<li className="divider" />
<li><NavLink to="/performer-dashboard" className={cls}>Performer Dashboard</NavLink></li>
<li><NavLink to="/admin-dashboard" className={cls}>Admin Dashboard</NavLink></li>


{/* Back to public site */}
<li><NavLink to="/" className={cls}>Public Site</NavLink></li>
</ul>
</nav>
);
};


export default MembersNavbar;