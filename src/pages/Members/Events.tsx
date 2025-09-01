// src/pages/Members/Events.tsx
import React from 'react';
import EventCard from '../../components/events/EventCard';
import type { EventType as EventCardType } from '../../components/events/EventCard';
import EventModal from '../../components/events/EventModal';
import { observeEvents } from '../../services/events';
import type { EventItem } from '../../types/events';
import { formatDateRange } from '../../utils/events';

function toEventCardType(vm: EventItem): EventCardType {
  const { date, time } = formatDateRange(vm);
  return {
    id: vm.id,
    title: vm.title,
    date,
    time,
    location: vm.location || '',
    description: vm.description || '',
    status: vm.status,
  };
}

const MembersEvents: React.FC = () => {
  const [events, setEvents] = React.useState<EventCardType[]>([]);
  const [active, setActive] = React.useState<EventCardType | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = observeEvents(
      (list) => {
        setEvents(list.map(toEventCardType)); // map EventItem -> EventCardType
        setLoading(false);
      },
      (err) => {
        console.error('[Events subscribe]', err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return (
    <section className="ucla-content" style={{ maxWidth: 980, margin: '0 auto' }}>
      <h1 className="ucla-heading-xl">Upcoming Events</h1>
      {loading && <p>Loading events…</p>}
      {!loading && events.length === 0 && <p>No events yet.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} onClick={() => setActive(ev)} />
        ))}
      </div>

      {active && <EventModal event={active} onClose={() => setActive(null)} />}
    </section>
  );
};

export default MembersEvents;
