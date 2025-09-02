// =============================================
// FILE: src/pages/Members/MemberEvents.tsx
// Purpose: Member-facing view-only list mapped to EventCard.EventType (dateStr required)
// =============================================
import React from 'react';
import EventCard, { type EventType as EventCardType } from '../../components/events/EventCard';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, subscribeUpcomingEvents } from '../../services/events';
import type { EventItem } from '../../types/events';
import { formatDateRange } from '../../utils/events';

// Map Firestore EventItem -> EventCardType expected by <EventCard/>
function toEventCardType(vm: EventItem): EventCardType {
  const { date, time } = formatDateRange(vm);
  return {
    id: vm.id,
    title: vm.title,
    dateStr: time ? `${date}, ${time}` : date, // <-- EventCard expects dateStr
    location: vm.location || '',
    notes: vm.description || '',
    status: vm.status,
  };
}

const MemberEvents: React.FC = () => {
  const [me, setMe] = React.useState<any>(null);
  const [events, setEvents] = React.useState<EventCardType[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setMe(u));

    const unsub = subscribeUpcomingEvents(['published'], (list: EventItem[]) => {
      setEvents(list.map(toEventCardType));
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
          <EventCard key={ev.id} event={ev} /* view-only: canManage=false, canRSVP=false */ />
        ))}
      </div>
    </section>
  );
};

export default MemberEvents;
