// src/pages/MembersEvents.tsx
import React from 'react';
import CalendarApp from '../../components/CalendarApp';
import '../../components/CalendarApp.css';

const MembersEvents: React.FC = () => {
  return (
    <section
      className="ucla-content"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '2rem',
        flexWrap: 'wrap',
        fontFamily: 'Helvetica, Arial, sans-serif',
        color: '#2774AE', // UCLA Blue
        backgroundColor: '#F5F5F5',
        padding: '2rem',
        borderRadius: '1rem'
      }}
    >
      <div style={{ flex: '1 1 350px', maxWidth: '420px' }}>
        <h1
          className="ucla-heading-xl"
          style={{ color: '#FFD100', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }} // UCLA Gold
        >
          Event Calendar
        </h1>
        <p className="ucla-paragraph" style={{ color: '#333', fontSize: '1.1rem', lineHeight: '1.5' }}>
          Click a future date to add a rehearsal or performance event.
        </p>
      </div>
      <div style={{ flex: '1 1 800px', minWidth: '500px' }}>
        <CalendarApp />
      </div>
    </section>
  );
};

export default MembersEvents;