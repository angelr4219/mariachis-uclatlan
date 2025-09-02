// =============================================
// FILE: src/pages/Members/PerformerAvailability.tsx
// Description: Performer sets availability per event.
// - Reads upcoming, published events from Firestore
// - Preloads the user's prior selection (yes/maybe/no)
// - Writes to events/{eventId}/availability/{uid}
// Note: This version avoids composite indexes by filtering & sorting client-side.
// =============================================
import React from 'react';
import type { ChangeEvent } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  where,
  setDoc,
  Timestamp,
  serverTimestamp,
  query,
  CollectionReference,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../../firebase';
import './PerformerAvailability.css';

// ---- Types ----
export type EventItem = {
  id: string;
  title: string;
  start?: Date | Timestamp | string | null;
  end?: Date | Timestamp | string | null;
  status?: 'draft' | 'published' | 'cancelled' | string;
  location?: string;
};

type AvailabilityStatus = 'yes' | 'no' | 'maybe';

// ---- Helpers ----
const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
};

const fmtRange = (start: any, end: any): string => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s) return '';
  const sStr = s.toLocaleString?.() || s.toISOString();
  if (!e) return sStr;
  const sameDay = s.toDateString() === e.toDateString();
  const eStr = sameDay ? e.toLocaleTimeString?.() : e.toLocaleString?.();
  return `${sStr} → ${eStr}`;
};

// ---- Component ----
const PerformerAvailability: React.FC = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [availability, setAvailability] = React.useState<Record<string, AvailabilityStatus | ''>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});

  // Load published events, then filter start>=now and sort client-side to avoid composite index
  React.useEffect(() => {
    const load = async () => {
      setError(null); setLoading(true);
      try {
        const col = collection(db, 'events') as CollectionReference;
        const qRef = query(col, where('status', '==', 'published'));// no orderBy here to avoid composite index
        const snap = await getDocs(qRef);
        const all: EventItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        const now = Date.now();
        const upcoming = all
          .filter((ev) => {
            const s = toDate(ev.start)?.getTime();
            return typeof s === 'number' ? s >= now - 1000 * 60 * 60 * 24 : true; // small past buffer
          })
          .sort((a, b) => {
            const sa = toDate(a.start)?.getTime() ?? 0;
            const sb = toDate(b.start)?.getTime() ?? 0;
            return sa - sb;
          });

        setEvents(upcoming);

        if (user) {
          const entries: Record<string, AvailabilityStatus | ''> = {};
          for (const ev of upcoming) {
            const ref = doc(db, 'events', ev.id, 'availability', user.uid);
            const av = await getDoc(ref);
            const status = (av.exists() ? (av.data() as any).status : '') as AvailabilityStatus | '';
            entries[ev.id] = (status || '') as any;
          }
          setAvailability(entries);
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const onChange = (eventId: string, e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as AvailabilityStatus | '';
    setAvailability((prev) => ({ ...prev, [eventId]: val }));
  };

  const onSubmit = async (eventId: string) => {
    if (!user) return;
    const status = (availability[eventId] || '') as AvailabilityStatus | '';
    if (!status) { alert('Please select an availability first.'); return; }

    setSaving((s) => ({ ...s, [eventId]: true }));
    try {
      const ref = doc(db, 'events', eventId, 'availability', user.uid);
      await setDoc(ref, {
        uid: user.uid,
        status,
        updatedAt: serverTimestamp(),
        displayName: user.displayName || user.email || 'Unknown',
        email: user.email || null,
      }, { merge: true });
      alert('Availability saved.');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Failed to save');
    } finally {
      setSaving((s) => ({ ...s, [eventId]: false }));
    }
  };

  if (!user) {
    return (
      <section className="ucla-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="ucla-heading-xl">Performer Availability</h1>
        <p>Please log in to set availability.</p>
      </section>
    );
  }

  return (
    <section className="ucla-content" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 className="ucla-heading-xl">Performer Availability</h1>
      {loading && <p>Loading events…</p>}
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <div className="availability-list">
        {events.map((ev) => (
          <div className="availability-card" key={ev.id}>
            <div className="availability-head">
              <h3 className="availability-title">{ev.title || 'Untitled Event'}</h3>
              <span className={`status-pill ${ev.status}`}>{ev.status}</span>
            </div>
            <div className="availability-meta">
              <div>
                <strong>When: </strong>
                <span>{fmtRange(ev.start, ev.end)}</span>
              </div>
              {ev.location && (
                <div>
                  <strong>Where: </strong>
                  <span>{ev.location}</span>
                </div>
              )}
            </div>

            <div className="availability-actions">
              <select
                value={availability[ev.id] || ''}
                onChange={(e) => onChange(ev.id, e)}
                aria-label={`Availability for ${ev.title}`}
              >
                <option value="">Select availability…</option>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
              <button disabled={!!saving[ev.id]} onClick={() => onSubmit(ev.id)}>{saving[ev.id] ? 'Saving…' : 'Submit'}</button>
            </div>
          </div>
        ))}

        {!loading && !events.length && (
          <p>No upcoming events yet.</p>
        )}
      </div>
    </section>
  );
};

export default PerformerAvailability;

