// =============================================
// FILE: src/pages/admin/AdminEvents.tsx (UPDATED)
// Purpose: Admin can create, edit, and cancel events
// - Subscribes to Firestore via services/events.observeEvents
// - Create: uses existing CreateEventModal
// - Edit: opens EditEventModal prefilled, saves via services/events.updateEvent
// =============================================
import React from 'react';
import EventCard from '../../components/events/EventCard';
import type { EventType as EventCardType } from '../../components/events/EventCard';
import { observeEvents, updateEvent, createEvent } from '../../services/events';
import type { EventItem } from '../../types/events';
import { formatDateRange } from '../../utils/events';
import CreateEventModal, { type EventDraft } from '../../components/events/CreateEventModal';
import EditEventModal, { type EventEditValues } from '../../components/events/EditEventModal';
import './AdminEvents.css';

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
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingInitial, setEditingInitial] = React.useState<EventEditValues | null>(null);

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

  const handleEdit = async (id: string) => {
    // Find the event in current list; if your EventCardType lacks raw fields,
    // the typical approach is to keep the source EventItem alongside.
    // Here we fetch by id from current list just to seed the modal with something.
    const src = events.find((e) => e.id === id);
    if (!src) return;

    // Provide minimal seed values; your EditEventModal can also fetch the full doc if needed.
    const seed: EventEditValues = {
      title: src.title,
      location: src.location || '',
      description: src.notes || '',
      // Defaults – EditEventModal will allow overriding date/time/status if you wire more fields
      date: '',
      startTime: '',
      endTime: '',
      status: src.status || 'draft',
    };

    setEditingId(id);
    setEditingInitial(seed);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete (cancel) this event?')) return;
    try {
      await updateEvent(id, { status: 'cancelled' });
    } catch (e) {
      console.error('[handleDelete]', e);
      alert('Failed to delete (cancel) event.');
    }
  };

  const handleCreate = async (d: EventDraft) => {
    const payload = {
      title: d.title.trim(),
      date: d.date, // expect utils/formatDateRange to understand this + times
      startTime: d.startTime || null,
      endTime: d.endTime || null,
      location: d.location?.trim() || '',
      description: d.description?.trim() || '',
      status: d.status ?? 'draft',
    } as any;
    await createEvent(payload);
  };

  const handleSaveEdit = async (values: EventEditValues) => {
    if (!editingId) return;
    const payload: any = {
      title: values.title.trim(),
      location: values.location.trim(),
      description: values.description.trim(),
      status: values.status,
    };

    // Only send date/time fields if provided (so partial edits don’t clobber existing data)
    if (values.date) payload.date = values.date;
    if (values.startTime) payload.startTime = values.startTime;
    if (values.endTime) payload.endTime = values.endTime;

    try {
      await updateEvent(editingId, payload);
      setEditingId(null);
      setEditingInitial(null);
    } catch (e) {
      console.error('[handleSaveEdit]', e);
      alert('Failed to update event.');
    }
  };

  return (
    <section className="ucla-content admin-events" style={{ maxWidth: 1024, margin: '0 auto' }}>
      <div className="admin-events__header">
        <h1 className="ucla-heading-xl">Manage Events</h1>
        <button className="btn" onClick={() => setShowCreate(true)}>+ Create Event</button>
      </div>

      {loading && <p>Loading events…</p>}

      {!loading && (
        <div className="admin-events__grid">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} canManage onEdit={() => handleEdit(ev.id)} onDelete={() => handleDelete(ev.id)} />
          ))}
        </div>
      )}

      {!loading && events.length === 0 && <p>No events found.</p>}

      {/* Create */}
      <CreateEventModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />

      {/* Edit */}
      <EditEventModal
        open={!!editingId}
        initialValues={editingInitial || undefined}
        onClose={() => { setEditingId(null); setEditingInitial(null); }}
        onSave={handleSaveEdit}
      />
    </section>
  );
};

export default AdminEvents;

