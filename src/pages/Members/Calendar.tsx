// ==============================
// FILE: src/pages/Members/Calendar.tsx
// ==============================
import React from 'react';
import CalendarApp from '../../components/Calendar/CalendarApp';
import type { EventItem } from '../../types/events';
import { useEvents } from '../hooks/useEvents';
import './Calendar.css';

const MembersCalendarPage: React.FC = () => {
  const { events, loading, error } = useEvents();
  const [active, setActive] = React.useState<EventItem | null>(null);

  // Close on ESC for better UX
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="ucla-content calendar-root" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1 className="ucla-heading-xl">Calendar</h1>
      <p className="ucla-paragraph">All events appear here automatically as they are added.</p>

      {loading && <p>Loading events…</p>}
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <CalendarApp events={events} onEventClick={setActive} />

      {active && (
        <div className="calendar-modal-backdrop" onClick={() => setActive(null)}>
          <div className="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="event-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="event-title">{active.title}</h3>
            <p className="calendar-meta">
              {active.start.toLocaleString()} {active.end ? `— ${active.end.toLocaleString()}` : ''}
            </p>
            {active.location && <p className="calendar-meta"><strong>Location:</strong> {active.location}</p>}
            {active.description && <p>{active.description}</p>}
            <div className="calendar-actions">
              <a className="calendar-btn" href={`/members/performer-availability?event=${active.id}`}>Respond Availability</a>
              <button className="calendar-btn secondary" onClick={() => setActive(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MembersCalendarPage;


