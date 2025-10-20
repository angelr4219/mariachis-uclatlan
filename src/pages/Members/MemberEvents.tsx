// =============================================
// FILE: src/pages/Members/MemberEvents.tsx  (REPLACEMENT)
// Purpose: Member-facing events list using EventCard.EventType
// Notes:
//  - Replaces the older src/pages/Members/Events.tsx
//  - Maps wider EventStatus to EventCard's narrow status set
// =============================================
import React from 'react';
import EventCard, { type EventType as EventCardType } from '../../components/events/EventCard';
import { subscribeUpcomingEvents } from '../../services/events';
import type { EventItem } from '../../types/events';
import { formatDateRange } from '../../utils/events';

function mapToCardStatus(s: EventItem['status']): EventCardType['status'] {
  switch (s) {
    case 'published': return 'published';
    case 'cancelled': return 'cancelled';
    default: return 'draft'; // draft | internal | requested → draft
  }
}

function toEventCardType(vm: EventItem): EventCardType {
  const { date, time } = formatDateRange(vm);
  return {
    id: vm.id,
    title: vm.title,
    dateStr: time ? `${date}, ${time}` : date,
    location: vm.location || '',
    notes: vm.description || '',
    status: mapToCardStatus(vm.status),
  };
}

const MemberEvents: React.FC = () => {
  const [events, setEvents] = React.useState<EventCardType[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = subscribeUpcomingEvents(['published'], (list: EventItem[]) => {
      setEvents(list.map(toEventCardType));
      setLoading(false);
    });
    return () => unsub();
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
