// src/pages/admin/AdminEvents.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  createEvent,
  publishEvent,
  cancelEvent,
  subscribeUpcomingEvents,
  updateEvent,
} from '../../services/events';
import type { EventItem, EventDoc, RoleNeed } from '../../types/events';
import '../../components/Calendar/CalendarApp';
import { Timestamp } from 'firebase/firestore';
import './AdminEvents.css'; 

const emptyRoles: RoleNeed[] = [
  { role: 'violin', count: 0 },
  { role: 'trumpet', count: 0 },
  { role: 'vihuela', count: 0 },
  { role: 'guitarrón', count: 0 },
  { role: 'guitarra', count: 0 },
  { role: 'harp', count: 0 },
];

export default function AdminEvents() {
  const nav = useNavigate();
  const [me, setMe] = useState<any>(null);
  const [rows, setRows] = useState<EventItem[]>([]); // EventItem uses Date for start/end

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setMe(u));
    const unsub = subscribeUpcomingEvents(['draft', 'published'], setRows);
    return () => { unsub(); unsubAuth(); };
  }, []);

  const [form, setForm] = useState({
    title: '',
    start: '', // e.g. 2025-09-01T18:00
    end: '',
    location: '',
    description: '', // use `description` (was `notes` before)
    roles: emptyRoles,
  });

  async function handleCreate() {
    if (!me?.email) { alert('Sign in as admin'); return; }

    const payload: Omit<EventDoc, 'id'|'createdAt'|'updatedAt'|'publishedAt'> = {
      title: form.title,
      start: Timestamp.fromDate(new Date(form.start)),
      end: form.end ? Timestamp.fromDate(new Date(form.end)) : undefined,
      location: form.location,
      description: form.description,
      status: 'draft',
      rolesNeeded: form.roles.filter(r => r.count > 0),
      assignedUids: [],
      client: null,
      createdBy: me.email,
    } as any;

    const id = await createEvent(payload);
    console.log('[Admin] created event', id);
    setForm({ title:'', start:'', end:'', location:'', description:'', roles: emptyRoles });
  }

  return (
    <div className="admin-events">  {/* ← wrap everything */}
      <h2>Admin Events</h2>

      <section className="event-form">
        <h3>New Event</h3>
        <div className="grid">
          {/* inputs ... */}
        </div>

        {/* For consistency, you can style the create button as primary: */}
        <button className="btn-primary" onClick={handleCreate} style={{ marginTop: '0.75rem' }}>
          Create (Draft)
        </button>
      </section>

      <section style={{ marginTop: '1rem' }}>
        <h3>Upcoming Events</h3>
        <div className="event-list">
          {rows.map(ev => (
            <div key={ev.id} className="event-card">
              <div className="event-head">
                <h3>{ev.title}</h3>
                <span className={`status ${ev.status}`}>{ev.status}</span>
              </div>

              <div className="event-meta">
                <div><strong>When:</strong> {ev.start.toLocaleString()} {ev.end ? `– ${ev.end.toLocaleTimeString()}` : ''}</div>
                <div><strong>Where:</strong> {ev.location}</div>
              </div>

              <div className="card-actions">
                {ev.status !== 'published' && (
                  <button className="btn-publish" onClick={() => publishEvent(ev.id!)}>Publish</button>
                )}
                {ev.status === 'published' && (
                  <button className="btn-cancel" onClick={() => cancelEvent(ev.id!)}>Cancel</button>
                )}
                <button
                  className="btn-edit"
                  onClick={() =>
                    updateEvent(ev.id!, { description: ((ev.description) || '') + '\n(edited)' })
                  }
                >
                  Quick Edit Notes
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
