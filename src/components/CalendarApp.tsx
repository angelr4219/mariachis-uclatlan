// src/pages/Calendar.tsx
import React from 'react';

const Calendar: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Performer Calendar</h1>
      <p>View upcoming rehearsals, performances, and events here.</p>
      {/* Embed Google Calendar, or custom event table */}
      <iframe
        src="https://calendar.google.com/calendar/embed?src=your_calendar_id&ctz=America%2FLos_Angeles"
        style={{ border: 0 }}
        width="100%"
        height="600"
        frameBorder="0"
        scrolling="no"
        title="Performer Calendar"
      ></iframe>
    </div>
  );
};

export default Calendar;
