// src/pages/MembersOnly.tsx
import React from 'react';
import MembersNavbar from '../components/MembersNavbar';
import MembersFooter from '../components/MembersFooter';

const MembersOnly: React.FC = () => {
  return (
    <>
      
      <section className="ucla-content">
        <h1 className="ucla-heading-xl">Welcome, Member!</h1>
        <p className="ucla-paragraph">This is your private portal. Here you’ll find updates, resources, and internal tools for Mariachi de Uclatlán members.</p>
      </section>
      
    </>
  );
};

export default MembersOnly;
