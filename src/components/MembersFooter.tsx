
// src/components/MemberFooter.tsx
import React from 'react';
import './MembersFooter.css';

const MembersFooter: React.FC = () => {
  return (
    <footer className="member-footer">
      <p>&copy; {new Date().getFullYear()} Mariachi de Uclatlán — Members Area</p>
    </footer>
  );
};

export default MembersFooter;