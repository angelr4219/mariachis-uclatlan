// src/components/Performer/PerformerDashboard.tsx
import React from 'react';
import PerformerNavbar from './performerNavbar';  // Adjust path if needed

const PerformerDashboard: React.FC = () => {
  return (
    <>
      <PerformerNavbar />

      <div style={{ padding: '2rem' }}>
        <h1>Performer Dashboard</h1>
        <p>Welcome to the Performer Dashboard. Here you can see your events, resources, and manage your profile.</p>
      </div>
    </>
  );
};

export default PerformerDashboard;