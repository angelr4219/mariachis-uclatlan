
// =============================================
// FILE: src/pages/admin/AdminEvents.tsx (UPDATED)
// - Adds a "View roster" button per event which opens RosterPanel
// - Uses your existing observeEvents + formatDateRange mapping
// =============================================
import React from 'react';
import EventCard from '../../components/events/EventCard';
import type { EventType as EventCardType } from '../../components/events/EventCard';
import { observeEvents, updateEvent, createEvent } from '../../services/events';
import type { EventItem } from '../../types/events';
import { formatDateRange } from '../../utils/events';
import CreateEventModal, { type EventDraft } from '../../components/events/CreateEventModal';
import EditEventModal, { type EventEditValues } from '../../components/events/EditEventModal';
import RosterPanel from '../../components/events/RosterPanel';
import './AdminEvents.css';

function toEventCardType(vm: EventItem): EventCardType {
  const { date, time } = formatDateRange(vm);
  return {
    id: vm.id,
    title: vm.title,
    dateStr: time ? `${date}, ${time}` : date,
    location: vm.location || '',
    notes: vm.description || '',
    status: ['draft', 'published', 'cancelled'].includes(vm.status) ? vm.status as 'draft' | 'published' | 'cancelled' : undefined,
  };
}

const AdminEvents: React.FC = () => {
  const [events, setEvents] = React.useState<EventCardType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingInitial, setEditingInitial] = React.useState<EventEditValues | null>(null);
  const [rosterOpen, setRosterOpen] = React.useState(false);
  const [rosterEventId, setRosterEventId] = React.useState<string | null>(null);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    const unsub = observeEvents(
      (list: EventItem[]) => {
        setEvents(list.map(toEventCardType));
        setLoading(false);
      },
      (e: unknown) => { setErr(String(e)); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const handleEdit = (id: string) => {
    const src = events.find((e) => e.id === id);
    if (!src) return;
    const seed: EventEditValues = {
      title: src.title,
      location: src.location || '',
      description: src.notes || '',
      date: '', startTime: '', endTime: '',
      status: (src.status as any) || 'draft',
    };
    setEditingId(id);
    setEditingInitial(seed);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete (cancel) this event?')) return;
    try { await updateEvent(id, { status: 'cancelled' } as any); }
    catch (e) { console.error(e); alert('Failed to cancel event.'); }
  };

  const handleCreate = async (d: EventDraft) => {
    const payload: any = {
      title: d.title.trim(),
      date: d.date,
      startTime: d.startTime || null,
      endTime: d.endTime || null,
      location: d.location?.trim() || '',
      description: d.description?.trim() || '',
      status: (d as any).status ?? 'draft',
    };
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
    if (values.date) payload.date = values.date;
    if (values.startTime) payload.startTime = values.startTime;
    if (values.endTime) payload.endTime = values.endTime;
    try { await updateEvent(editingId, payload); setEditingId(null); setEditingInitial(null); }
    catch (e) { console.error(e); alert('Failed to update event.'); }
  };

  const openRoster = (eventId: string) => { setRosterEventId(eventId); setRosterOpen(true); };

  return (
    <section className="ucla-content admin-events" style={{ maxWidth: 1024, margin: '0 auto' }}>
      <div className="admin-events__header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.5rem' }}>
        <h1 className="ucla-heading-xl">Manage Events</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Event</button>
      </div>

      {loading && <p>Loading events…</p>}
      {!loading && err && <p className="err" role="alert">{err}</p>}

      {!loading && (
        <div className="admin-events__grid" style={{ display:'grid', gap:'.75rem' }}>
          {events.map((ev) => (
            <div key={ev.id} className="event-card">
              <EventCard event={ev} canManage onEdit={() => handleEdit(ev.id)} onDelete={() => handleDelete(ev.id)} />
              <div className="card-actions" style={{ marginTop: '.5rem' }}>
                <button className="btn" onClick={() => openRoster(ev.id)}>View roster</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && events.length === 0 && <p>No events found.</p>}

      <CreateEventModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />

      <EditEventModal
        open={!!editingId}
        initialValues={editingInitial || undefined}
        onClose={() => { setEditingId(null); setEditingInitial(null); }}
        onSave={handleSaveEdit}
      />

      <RosterPanel
        open={rosterOpen}
        eventId={rosterEventId}
        onClose={() => setRosterOpen(false)}
        includeMaybe
      />
    </section>
  );
};

export default AdminEvents;
