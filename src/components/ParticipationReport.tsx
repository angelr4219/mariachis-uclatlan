// =============================================
// FILE: src/pages/admin/ParticipationReport.tsx
// Description: Admin report that summarizes performer responses per event
// - Reads events and their subcollection: events/{eventId}/availability
// - Aggregates counts for yes/maybe/no
// - Optional: view people lists per event (modal)
// =============================================
import React from 'react';
import {
  collection,
  getDocs,
  CollectionReference,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import './ParticipationReport.css';

// ---- Types ----
export type EventItem = {
  id: string;
  title?: string;
  start?: Date | Timestamp | string | null;
  end?: Date | Timestamp | string | null;
};

type AvailabilityDoc = {
  uid: string;
  status?: string; // 'yes' | 'maybe' | 'no'
  displayName?: string | null;
  email?: string | null;
};

type Person = { uid: string; name: string; email: string; status: 'yes'|'maybe'|'no' };

type Row = {
  eventId: string;
  title: string;
  start?: Date | undefined;
  end?: Date | undefined;
  yes: number;
  maybe: number;
  no: number;
  people: { yes: Person[]; maybe: Person[]; no: Person[] };
};

// ---- Helpers ----
const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  try { const d = new Date(v); return isNaN(d.getTime()) ? undefined : d; } catch { return undefined; }
};

const dateRange = (s?: Date, e?: Date) => {
  if (!s) return '';
  const sStr = s.toLocaleString?.() || s.toISOString();
  if (!e) return sStr;
  const same = s.toDateString() === e.toDateString();
  const eStr = same ? e.toLocaleTimeString?.() : e.toLocaleString?.();
  return `${sStr} → ${eStr}`;
};

const normalizeStatus = (raw?: string): 'yes'|'maybe'|'no'|null => {
  const k = (raw || '').toLowerCase().trim();
  if (k === 'yes' || k === 'available' || k === 'confirmed') return 'yes';
  if (k === 'maybe') return 'maybe';
  if (k === 'no' || k === 'unavailable' || k === 'declined') return 'no';
  return null;
};

// ---- Component ----
const ParticipationReport: React.FC = () => {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<Row | null>(null);

  const load = React.useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const evSnap = await getDocs(collection(db, 'events') as CollectionReference);
      const events: EventItem[] = evSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      // Sort by start asc
      events.sort((a, b) => (toDate(a.start)?.getTime() ?? 0) - (toDate(b.start)?.getTime() ?? 0));

      const data: Row[] = await Promise.all(events.map(async (ev) => {
        const sub = await getDocs(collection(db, 'events', ev.id, 'availability'));
        const people: { yes: Person[]; maybe: Person[]; no: Person[] } = { yes: [], maybe: [], no: [] };
        sub.docs.forEach((doc) => {
          const d = doc.data() as AvailabilityDoc;
          const s = normalizeStatus(d.status);
          if (!s) return;
          const name = (d.displayName || '').trim() || (d.email || '').trim() || d.uid || 'Unknown';
          const email = d.email || '';
          people[s].push({ uid: d.uid, name, email, status: s });
        });
        return {
          eventId: ev.id,
          title: ev.title || ev.id,
          start: toDate(ev.start),
          end: toDate(ev.end),
          yes: people.yes.length,
          maybe: people.maybe.length,
          no: people.no.length,
          people,
        };
      }));

      setRows(data);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load participation');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <section className="ucla-content" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="rep-head">
        <h1 className="ucla-heading-xl">Participation Report</h1>
        <div className="rep-actions">
          <button onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <div className="rep-table-wrap">
        <table className="rep-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date/Time</th>
              <th>Yes</th>
              <th>Maybe</th>
              <th>No</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.eventId}>
                <td className="rep-event-title">{r.title}</td>
                <td>{dateRange(r.start, r.end)}</td>
                <td className="yes">{r.yes}</td>
                <td className="maybe">{r.maybe}</td>
                <td className="no">{r.no}</td>
                <td><button className="link-btn" onClick={() => setActive(r)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!loading && rows.length === 0) && <p>No events found.</p>}

      {active && (
        <div className="rep-modal-backdrop" onClick={() => setActive(null)}>
          <div className="rep-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{active.title}</h3>
            <p className="rep-sub">{dateRange(active.start, active.end)}</p>
            <div className="rep-columns">
              <div>
                <h4>Yes ({active.yes})</h4>
                <ul>
                  {active.people.yes.map(p => <li key={p.uid}><strong>{p.name}</strong>{p.email ? ` · ${p.email}` : ''}</li>)}
                </ul>
              </div>
              <div>
                <h4>Maybe ({active.maybe})</h4>
                <ul>
                  {active.people.maybe.map(p => <li key={p.uid}><strong>{p.name}</strong>{p.email ? ` · ${p.email}` : ''}</li>)}
                </ul>
              </div>
              <div>
                <h4>No ({active.no})</h4>
                <ul>
                  {active.people.no.map(p => <li key={p.uid}><strong>{p.name}</strong>{p.email ? ` · ${p.email}` : ''}</li>)}
                </ul>
              </div>
            </div>
            <div className="rep-modal-actions">
              <button onClick={() => setActive(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ParticipationReport;

