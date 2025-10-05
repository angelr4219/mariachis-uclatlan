// =============================================
// FILE: src/pages/Members/PerformerAvailability.tsx
// Description: Cleaner layout for performer RSVP with inline success/error banners.
// - Keeps Firestore read/write behavior identical
// - Replaces window.alerts with accessible inline banners
// - Improves card layout, spacing, and responsive grid
// - NEW: respects admin-finalized RSVPs (locks select + submit when finalized)
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

const toTimestamp = (v: any): Timestamp | null => {
  const d = toDate(v);
  return d ? Timestamp.fromDate(d) : null;
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
  const [locked, setLocked] = React.useState<Record<string, boolean>>({}); // NEW: admin-finalized lock map

  // New: lightweight page-level banner for submit feedback
  const [banner, setBanner] = React.useState<null | { type: 'success' | 'error'; text: string }>(null);

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

        // Pre-seed controlled state
        const seedAvail: Record<string, AvailabilityStatus | ''> = {};
        const seedLock: Record<string, boolean> = {};
        for (const ev of upcoming) { seedAvail[ev.id] = ''; seedLock[ev.id] = false; }
        setAvailability(seedAvail);
        setLocked(seedLock);

        if (user) {
          // Load existing RSVP docs sequentially (keeps writes minimal and easy to read)
          const entries: Record<string, AvailabilityStatus | ''> = { ...seedAvail };
          const locks: Record<string, boolean> = { ...seedLock };
          for (const ev of upcoming) {
            const ref = doc(db, 'events', ev.id, 'availability', user.uid);
            const av = await getDoc(ref);
            const data: any = av.exists() ? av.data() : undefined;
            const status = (data?.status || '') as AvailabilityStatus | '';
            const isFinal = Boolean(data?.finalized);
            entries[ev.id] = status;
            locks[ev.id] = isFinal;
          }
          setAvailability(entries);
          setLocked(locks);
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
    if (!user) { setBanner({ type: 'error', text: 'Try again or re‑login.' }); return; }
    if (locked[eventId]) { setBanner({ type: 'error', text: 'This RSVP was finalized by an admin.' }); return; }

    const status = (availability[eventId] || '') as AvailabilityStatus | '';
    if (!status) { setBanner({ type: 'error', text: 'Please select an availability first.' }); return; }

    const ev = events.find((x) => x.id === eventId);
    setSaving((s) => ({ ...s, [eventId]: true }));
    setBanner(null);
    try {
      const subRef = doc(db, 'events', eventId, 'availability', user.uid);

      // Rich payload for subcollection (keeps event snapshot + responder info)
      const payload = {
        uid: user.uid,
        displayName: user.displayName || user.email || 'Unknown',
        email: user.email || null,
        status, // 'yes' | 'maybe' | 'no'
        updatedAt: serverTimestamp(),
        // Event snapshot (useful if title/time changes later)
        eventId,
        eventTitle: ev?.title || 'Untitled Event',
        eventStart: toTimestamp(ev?.start), // Firestore Timestamp or null
        eventEnd: toTimestamp(ev?.end),
        eventLocation: ev?.location || null,
        finalized: false, // members cannot finalize
      } as const;

      await setDoc(subRef, payload, { merge: true });

      // Mirror to flat collections for admin reporting (keep both for compatibility)
      const flatId = `${eventId}_${user.uid}`;
      await setDoc(doc(db, 'availability_responses', flatId), payload, { merge: true });
      await setDoc(doc(db, 'availability', flatId), payload, { merge: true });

      setBanner({ type: 'success', text: 'Thank you — your response has been submitted.' });
    } catch (e: any) {
      console.error(e);
      setBanner({ type: 'error', text: 'Something went wrong. Try again or re‑login.' });
    } finally {
      setSaving((s) => ({ ...s, [eventId]: false }));
    }
  };

  if (!user) {
    return (
      <section className="ucla-content availability-shell">
        <h1 className="ucla-heading-xl">Performer Availability</h1>
        <p>Please log in to set availability.</p>
      </section>
    );
  }

  return (
    <section className="ucla-content availability-shell">
      <h1 className="ucla-heading-xl">Performer Availability</h1>

      {banner && (
        <div
          className={`inline-banner ${banner.type}`}
          role="status"
          aria-live="polite"
        >
          {banner.type === 'success' ? (
            <span className="banner-icon" aria-hidden>✓</span>
          ) : (
            <span className="banner-icon" aria-hidden>!</span>
          )}
          <span>{banner.text}</span>
          <button
            className="banner-dismiss"
            onClick={() => setBanner(null)}
            aria-label="Dismiss"
          >×</button>
        </div>
      )}

      {loading && <p className="muted">Loading events…</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="availability-list">
        {events.map((ev) => (
          <article className="availability-card" key={ev.id}>
            <header className="availability-head">
              <h3 className="availability-title">{ev.title || 'Untitled Event'}</h3>
              <span className={`status-pill ${ev.status}`}>{ev.status}</span>
            </header>

            <dl className="availability-meta">
              <div className="meta-row">
                <dt>When</dt>
                <dd>{fmtRange(ev.start, ev.end) || 'TBA'}</dd>
              </div>
              {ev.location && (
                <div className="meta-row">
                  <dt>Where</dt>
                  <dd>{ev.location}</dd>
                </div>
              )}
            </dl>

            <div className="availability-actions">
              <label className="sr-only" htmlFor={`sel-${ev.id}`}>
                Availability for {ev.title}
              </label>
              <select
                id={`sel-${ev.id}`}
                value={availability[ev.id] || ''}
                onChange={(e) => onChange(ev.id, e)}
                disabled={locked[ev.id] || !!saving[ev.id]}
              >
                <option value="">Select availability…</option>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
              <button
                className="btn-primary"
                disabled={locked[ev.id] || !!saving[ev.id]}
                onClick={() => onSubmit(ev.id)}
              >
                {saving[ev.id] ? 'Saving…' : locked[ev.id] ? 'Finalized' : 'Submit'}
              </button>
            </div>

            {locked[ev.id] && (
              <p className="finalized-note">This RSVP was finalized by an admin and can’t be changed.</p>
            )}
          </article>
        ))}

        {!loading && !events.length && (
          <p className="muted">No upcoming events yet.</p>
        )}
      </div>
    </section>
  );
};

export default PerformerAvailability;

