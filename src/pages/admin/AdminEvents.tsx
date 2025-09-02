
// =============================================
// FILE: src/pages/admin/AdminEvents.tsx (UPDATED)
// Adds: create button + modal; calls services.events.createEvent
// =============================================
import React from 'react';
import EventCard from '../../components/events/EventCard';
import type { EventType as EventCardType } from '../../components/events/EventCard';
import { observeEvents, updateEvent, createEvent } from '../../services/events';
import type { EventItem } from '../../types/events';
import { formatDateRange } from '../../utils/events';
import CreateEventModal, { type EventDraft } from '../../components/events/CreateEventModal';

function toEventCardType(vm: EventItem): EventCardType {
  const { date, time } = formatDateRange(vm);
  return {
    id: vm.id,
    title: vm.title,
    dateStr: time ? `${date}, ${time}` : date,
    location: vm.location || '',
    notes: vm.description || '',
    status: vm.status,
  };
}

const AdminEvents: React.FC = () => {
  const [events, setEvents] = React.useState<EventCardType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);

  React.useEffect(() => {
    const unsub = observeEvents(
      (list: EventItem[]) => {
        setEvents(list.map(toEventCardType));
        setLoading(false);
      },
      (err: unknown) => {
        console.error('[AdminEvents subscribe]', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleEdit = (id: string) => {
    console.log('edit', id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete (cancel) this event?')) return;
    try { await updateEvent(id, { status: 'cancelled' }); }
    catch (e) { console.error('[handleDelete]', e); alert('Failed to delete (cancel) event.'); }
  };

  const handleCreate = async (d: EventDraft) => {
    // Map EventDraft -> your EventItem create payload
    const payload = {
      title: d.title.trim(),
      date: d.date,           // expect utils/formatDateRange to understand this + times
      startTime: d.startTime || null,
      endTime: d.endTime || null,
      location: d.location?.trim() || '',
      description: d.description?.trim() || '',
      status: d.status ?? 'draft',
    } as any;
    await createEvent(payload);
  };

  return (
    <section className="ucla-content" style={{ maxWidth: 1024, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 className="ucla-heading-xl">Manage Events</h1>
        <button className="btn" onClick={() => setShowCreate(true)}>+ Create Event</button>
      </div>

      {loading && <p>Loading events…</p>}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} canManage onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {!loading && events.length === 0 && <p>No events found.</p>}

      <CreateEventModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </section>
  );
};

export default AdminEvents;

