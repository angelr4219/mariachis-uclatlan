
// src/pages/MembersResources.tsx
import React from 'react';

const MembersResources: React.FC = () => {
  return (
    <section className="ucla-content">
      <h1 className="ucla-heading-xl">Exclusive Resources</h1>
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
    </section>
  );
};

export default MembersResources;