// =============================================
// FILE: src/pages/Members/PerformerAvailability.tsx
// Purpose: Performer sets RSVP; admin can later finalize.
// Robust version with path guards to avoid "even segments" errors.
// - Loads published events
// - Reads/writes per-user RSVP at: events/{eventId}/availability/{uid}
// - Mirrors to flat: availability/{eventId_uid} and availability_responses/{eventId_uid}
// - Adds hard guards + debug logs to pinpoint any bad eventId/uid
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
  const dateOpts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  if (!e)
    return `${s.toLocaleDateString(undefined, dateOpts)} ${s.toLocaleTimeString(undefined, timeOpts)}`;
  const sameDay = s.toDateString() === e.toDateString();
  const left = `${s.toLocaleDateString(undefined, dateOpts)} ${s.toLocaleTimeString(undefined, timeOpts)}`;
  const right = sameDay
    ? e.toLocaleTimeString(undefined, timeOpts)
    : `${e.toLocaleDateString(undefined, dateOpts)} ${e.toLocaleTimeString(undefined, timeOpts)}`;
  return `${left} → ${right}`;
};

// ---- Path builders + guards ----
const invariant: (cond: any, msg: string) => asserts cond = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const buildEventAvailabilityDoc = (eventId: string, uid: string) => {
  invariant(eventId && typeof eventId === 'string', '[PerformerAvailability] Missing eventId');
  invariant(uid && typeof uid === 'string', '[PerformerAvailability] Missing uid');
  // Extra debug to help spot weird ids in console
  if (eventId === 'availability' || eventId.includes('/')) {
    console.error('[PerformerAvailability] Suspicious eventId detected:', { eventId, uid });
  }
  return doc(db, 'events', eventId, 'availability', uid);
};

const flatAvailabilityDoc = (eventId: string, uid: string) => doc(db, 'availability', `${eventId}_${uid}`);
const flatResponsesDoc = (eventId: string, uid: string) => doc(db, 'availability_responses', `${eventId}_${uid}`);

// ---- Component ----
const PerformerAvailability: React.FC = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [availability, setAvailability] = React.useState<Record<string, AvailabilityStatus | ''>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});
  const [locked, setLocked] = React.useState<Record<string, boolean>>({});

  const [banner, setBanner] = React.useState<null | { type: 'success' | 'error'; text: string }>(null);
  const bannerTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    const load = async () => {
      setError(null);
      setLoading(true);
      try {
        const qRef = query(collection(db, 'events'), where('status', '==', 'published'));
        const snap = await getDocs(qRef);
        const all: EventItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        // Debug: list ids we got back
        console.table(all.map((e) => ({ id: e.id, title: (e as any).title })));

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

        const seedAvail: Record<string, AvailabilityStatus | ''> = {};
        const seedLock: Record<string, boolean> = {};
        for (const ev of upcoming) {
          seedAvail[ev.id] = '';
          seedLock[ev.id] = false;
        }
        setAvailability(seedAvail);
        setLocked(seedLock);

        if (user) {
          const entries: Record<string, AvailabilityStatus | ''> = { ...seedAvail };
          const locks: Record<string, boolean> = { ...seedLock };
          for (const ev of upcoming) {
            if (!ev?.id) {
              console.warn('[PerformerAvailability] Skipping event with missing id:', ev);
              continue;
            }
            try {
              const ref = buildEventAvailabilityDoc(ev.id, user.uid);
              const av = await getDoc(ref);
              const data: any = av.exists() ? av.data() : undefined;
              const status = (data?.status || '') as AvailabilityStatus | '';
              const isFinal = Boolean(data?.finalized);
              entries[ev.id] = status;
              locks[ev.id] = isFinal;
            } catch (err) {
              console.error('[PerformerAvailability] Failed to read availability for event', ev.id, err);
            }
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
    void load();

    return () => {
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    };
  }, [user]);

  const onChange = (eventId: string, e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as AvailabilityStatus | '';
    setAvailability((prev) => ({ ...prev, [eventId]: val }));
  };

  const showSuccess = (text: string) => {
    setBanner({ type: 'success', text });
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 3500);
  };

  const showError = (text: string) => {
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    setBanner({ type: 'error', text });
  };

  // Shared writer for one event
  const writeAvailability = async (eventId: string, status: AvailabilityStatus) => {
    if (!user) throw new Error('no-auth');
    const ev = events.find((x) => x.id === eventId);

    const subRef = buildEventAvailabilityDoc(eventId, user.uid);

    const payload = {
      uid: user.uid,
      displayName: user.displayName || user.email || 'Unknown',
      email: user.email || null,
      status, // 'yes' | 'maybe' | 'no'
      updatedAt: serverTimestamp(),
      eventId,
      eventTitle: ev?.title || 'Untitled Event',
      eventStart: toTimestamp(ev?.start),
      eventEnd: toTimestamp(ev?.end),
      eventLocation: ev?.location || null,
      finalized: false,
    } as const;

    await setDoc(subRef, payload, { merge: true });
    await setDoc(flatResponsesDoc(eventId, user.uid), payload, { merge: true });
    await setDoc(flatAvailabilityDoc(eventId, user.uid), payload, { merge: true });
  };

  // Bulk apply to ALL (skips locked). Shows a summary banner.
  const applyToAll = async (status: AvailabilityStatus) => {
    if (!user) {
      showError('Please try again.');
      return;
    }
    const confirmText = `Apply "${status.toUpperCase()}" to all events? Locked (finalized) items will be skipped.`;
    if (!window.confirm(confirmText)) return;

    setAvailability((prev) => {
      const next = { ...prev } as Record<string, AvailabilityStatus | ''>;
      for (const ev of events) {
        if (!locked[ev.id]) next[ev.id] = status;
      }
      return next;
    });

    try {
      let ok = 0,
        skipped = 0,
        failed = 0;
      for (const ev of events) {
        if (locked[ev.id]) {
          skipped++;
          continue;
        }
        try {
          await writeAvailability(ev.id, status);
          ok++;
        } catch (err) {
          console.error('[PerformerAvailability] Bulk write failed for', ev.id, err);
          failed++;
        }
      }
      const parts: string[] = [];
      if (ok) parts.push(`${ok} updated`);
      if (skipped) parts.push(`${skipped} skipped`);
      if (failed) parts.push(`${failed} failed`);
      const msg = parts.length ? parts.join(' • ') : 'No changes';
      if (failed) showError(`Done with issues — ${msg}`);
      else showSuccess(`Done — ${msg}.`);
    } catch (e) {
      console.error(e);
      showError('Please try again.');
    }
  };

  const onSubmit = async (eventId: string) => {
    if (!user) {
      showError('Please try again.');
      return;
    }
    if (locked[eventId]) {
      showError('This RSVP was finalized by an admin.');
      return;
    }

    const status = (availability[eventId] || '') as AvailabilityStatus | '';
    if (!status) {
      showError('Please select an availability first.');
      return;
    }

    setSaving((s) => ({ ...s, [eventId]: true }));
    try {
      await writeAvailability(eventId, status);
      showSuccess('Thank you for submitting your availability.');
    } catch (e) {
      console.error(e);
      showError('Please try again.');
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
        <div className={`inline-banner ${banner.type}`} role="status" aria-live="polite">
          {banner.type === 'success' ? (
            <span className="banner-icon" aria-hidden>
              ✓
            </span>
          ) : (
            <span className="banner-icon" aria-hidden>
              !
            </span>
          )}
          <span>{banner.text}</span>
          <button className="banner-dismiss" onClick={() => setBanner(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {/* Bulk apply toolbar */}
      <div className="bulk-toolbar">
        <span className="muted">Apply to all:</span>
        <button className="btn bulk yes" onClick={() => applyToAll('yes')}>
          Mark all Yes
        </button>
        <button className="btn bulk maybe" onClick={() => applyToAll('maybe')}>
          Mark all Maybe
        </button>
        <button className="btn bulk no" onClick={() => applyToAll('no')}>
          Mark all No
        </button>
      </div>

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

        {!loading && !events.length && <p className="muted">No upcoming events yet.</p>}
      </div>
    </section>
  );
};

export default PerformerAvailability;
