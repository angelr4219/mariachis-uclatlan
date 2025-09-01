// src/pages/Members/MemberEvents.tsx
import React from 'react';
import EventCard, { type EventType as EventCardType } from '../../components/events/EventCard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, subscribeUpcomingEvents } from '../../services/events';
import type { EventItem } from '../../types/events';
import { formatCardVM } from '../../utils/events';

const MemberEvents: React.FC = () => {
  const [me, setMe] = React.useState<any>(null);
  const [events, setEvents] = React.useState<EventCardType[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setMe(u));
    const unsub = subscribeUpcomingEvents(['published'], (list: EventItem[]) => {
      setEvents(list.map((e) => formatCardVM(e)));
      setLoading(false);
    });
    return () => { unsub(); unsubAuth(); };
  }, []);

  return (
    <section className="ucla-content" style={{ maxWidth: 980, margin: '0 auto' }}>
      <h1 className="ucla-heading-xl">Upcoming Events</h1>
      {loading && <p>Loading events…</p>}
      {!loading && events.length === 0 && <p>No events yet.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} />
        ))}
      </div>
    </section>
  );
};

export default MemberEvents;
