// src/pages/Members/RSVP.tsx
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { fetchAssignedEventsForUser, respondToRSVP } from '../../services/events';
import type { RSVPStatus } from '../../types/events';
import './RSVP';

// 👇 import your base EventItem and extend for UI
import type { EventItem as BaseEventItem } from '../../types/events';
type UIEventItem = BaseEventItem & {
  location?: string;
  notes?: string;
  start?: string | number | Date;
  date?: string | number | Date;
};

const RSVP: React.FC = () => {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UIEventItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUid(u.uid);
        setLoading(true);
        const rows = await fetchAssignedEventsForUser(u.uid);
        // cast to UIEventItem[] for UI-only optional fields
        setEvents(rows as UIEventItem[]);
        setLoading(false);
      } else {
        setUid(null);
        setEvents([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleRSVP = async (eventId: string, status: RSVPStatus) => {
    if (!uid) return;
    try {
      setBusy(eventId);
      await respondToRSVP(eventId, uid, status);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="rsvp-wrap">Loading your assigned events…</div>;
  if (!uid) return <div className="rsvp-wrap">Please log in to see your RSVP list.</div>;

  return (
    <div className="rsvp-wrap">
      <h1 className="rsvp-title">My RSVPs</h1>
      {events.length === 0 ? (
        <p>No assigned events yet.</p>
      ) : (
        <ul className="rsvp-list">
          {events.map((ev) => {
            const when = new Date((ev.start ?? ev.date) as any).toLocaleString();
            return (
              <li className="rsvp-card" key={ev.id}>
                <div className="rsvp-head">
                  <div>
                    <div className="rsvp-event-title">{ev.title}</div>
                    <div className="rsvp-meta">
                      {when} {ev.location ? `• ${ev.location}` : ''}
                    </div>
                  </div>
                  <div className="rsvp-actions">
                    <button disabled={busy === ev.id} onClick={() => handleRSVP(ev.id, 'accepted')}>Accept</button>
                    <button disabled={busy === ev.id} onClick={() => handleRSVP(ev.id, 'declined')}>Decline</button>
                    <button disabled={busy === ev.id} onClick={() => handleRSVP(ev.id, 'tentative')}>Maybe</button>
                  </div>
                </div>
                {!!ev.notes && <p className="rsvp-notes">{ev.notes}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RSVP;
