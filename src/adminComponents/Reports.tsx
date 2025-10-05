// =============================================
// FILE: src/pages/admin/Reports.tsx
// Purpose: Admin reports page that fetches counts from Firestore for
//          Events, Inquiries, and Availability over a date range.
//          Adds finalize flow: approve performers and write payments.
//          FIXES: availability mirror uses `eventStart` + supports status/response.
// =============================================
import React from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,

  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import './Reports.css';

interface BaseDoc {
  id: string;
  date: Date | null;
  status?: string;
  title?: string;
  start?: Timestamp | Date | string | null;
  end?: Timestamp | Date | string | null;
  location?: string;
}

interface AvailabilityDoc extends BaseDoc {
  response?: 'Yes' | 'No' | 'Maybe' | string;
  eventId?: string;
  uid?: string;
  name?: string;
}

type FinalizeRow = { uid: string; name: string; approved: boolean };

const toDate = (value: any): Date | null => {
  try {
    if (!value && value !== 0) return null;
    if (value && typeof value === 'object' && 'toDate' in value) return (value as Timestamp).toDate();
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'number') return new Date(value);
  } catch {}
  return null;
};
const titleCase = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : undefined);
const normalizeStatus = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Unknown');

const hoursBetween = (start?: any, end?: any): number => {
  const s = start ? toDate(start) : null;
  const e = end ? toDate(end) : null;
  if (!s || !e) return 0;
  const ms = Math.max(0, e.getTime() - s.getTime());
  return Math.round((ms / 36e5) * 4) / 4;
};

const Reports: React.FC = () => {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [eventDocs, setEventDocs] = React.useState<BaseDoc[]>([]);
  const [inquiryDocs, setInquiryDocs] = React.useState<BaseDoc[]>([]);
  const [availabilityDocs, setAvailabilityDocs] = React.useState<AvailabilityDoc[]>([]);

  const [eventStats, setEventStats] = React.useState({ total: 0, published: 0, canceled: 0, completed: 0 });
  const [inquiryStats, setInquiryStats] = React.useState({ Submitted: 0, Accepted: 0, Booked: 0, Completed: 0 } as Record<string, number>);
  const [availabilityStats, setAvailabilityStats] = React.useState({ total: 0, Yes: 0, Maybe: 0, No: 0 });
  const [financeHours, setFinanceHours] = React.useState(0);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<BaseDoc | null>(null);
  const [finalizeRows, setFinalizeRows] = React.useState<FinalizeRow[]>([]);
  const [finalizing, setFinalizing] = React.useState(false);

  const fetchCounts = React.useCallback(async () => {
    setLoading(true);
    setError('');

    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59.999') : null;

    try {
      // Events
      const eventsColl = collection(db, 'events');
      let eventsQuery;
      if (start && end) {
        eventsQuery = query(eventsColl, where('date', '>=', Timestamp.fromDate(start)), where('date', '<=', Timestamp.fromDate(end)), orderBy('date', 'desc'));
      } else if (start) {
        eventsQuery = query(eventsColl, where('date', '>=', Timestamp.fromDate(start)), orderBy('date', 'desc'));
      } else if (end) {
        eventsQuery = query(eventsColl, where('date', '<=', Timestamp.fromDate(end)), orderBy('date', 'desc'));
      } else {
        eventsQuery = query(eventsColl, orderBy('date', 'desc'));
      }
      const eventsSnap = await getDocs(eventsQuery);
      const events: BaseDoc[] = eventsSnap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          date: toDate((data as any).date ?? (data as any).start),
          start: (data as any).start ?? (data as any).date,
          end: (data as any).end ?? null,
          status: (data as any).status ? normalizeStatus((data as any).status) : undefined,
          title: (data as any).title || (data as any).name,
          location: (data as any).location,
        };
      });
      const eStats = { total: events.length, published: 0, canceled: 0, completed: 0 };
      for (const e of events) {
        const s = (e.status || '').toLowerCase();
        if (s === 'published' || s === 'confirmed') eStats.published++;
        else if (s === 'cancelled' || s === 'canceled') eStats.canceled++;
        else if (s === 'completed' || s === 'done') eStats.completed++;
      }

      // Inquiries
      const inquiriesColl = collection(db, 'inquiries');
      let inqQuery;
      if (start && end) {
        inqQuery = query(inquiriesColl, where('date', '>=', Timestamp.fromDate(start)), where('date', '<=', Timestamp.fromDate(end)), orderBy('date', 'desc'));
      } else if (start) {
        inqQuery = query(inquiriesColl, where('date', '>=', Timestamp.fromDate(start)), orderBy('date', 'desc'));
      } else if (end) {
        inqQuery = query(inquiriesColl, where('date', '<=', Timestamp.fromDate(end)), orderBy('date', 'desc'));
      } else {
        inqQuery = query(inquiriesColl, orderBy('date', 'desc'));
      }
      const inqSnap = await getDocs(inqQuery);
      const inquiries: BaseDoc[] = inqSnap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          date: toDate((data as any).date),
          status: (data as any).status ? normalizeStatus((data as any).status) : undefined,
          title: (data as any).title || (data as any).clientName || (data as any).subject,
        };
      });
      const iStats = { Submitted: 0, Accepted: 0, Booked: 0, Completed: 0 } as Record<string, number>;
      for (const q of inquiries) {
        const s = normalizeStatus(q.status);
        if (s in iStats) (iStats as any)[s]++;
      }

      // Availability (flat mirror) — use eventStart not date
      const availColl = collection(db, 'availability');
      let availQuery;
      if (start && end) {
        availQuery = query(availColl, where('eventStart', '>=', Timestamp.fromDate(start)), where('eventStart', '<=', Timestamp.fromDate(end)), orderBy('eventStart', 'desc'));
      } else if (start) {
        availQuery = query(availColl, where('eventStart', '>=', Timestamp.fromDate(start)), orderBy('eventStart', 'desc'));
      } else if (end) {
        availQuery = query(availColl, where('eventStart', '<=', Timestamp.fromDate(end)), orderBy('eventStart', 'desc'));
      } else {
        availQuery = query(availColl, orderBy('eventStart', 'desc'));
      }
      const availSnap = await getDocs(availQuery);
      const availability: AvailabilityDoc[] = availSnap.docs.map((d) => {
        const data = d.data() as DocumentData;
        const raw = (data as any).response ?? (data as any).status;
        const norm = typeof raw === 'string' ? raw.toLowerCase() : '';
        const response = norm === 'yes' ? 'Yes' : norm === 'no' ? 'No' : norm === 'maybe' ? 'Maybe' : titleCase((data as any).response);
        return {
          id: d.id,
          uid: (data as any).uid,
          name: (data as any).displayName || (data as any).name,
          date: toDate((data as any).eventStart ?? (data as any).date),
          response,
          eventId: (data as any).eventId,
          title: (data as any).title || (data as any).eventTitle,
        };
      });
      const aStats = { total: availability.length, Yes: 0, Maybe: 0, No: 0 };
      for (const r of availability) {
        if (r.response === 'Yes') aStats.Yes++;
        else if (r.response === 'Maybe') aStats.Maybe++;
        else if (r.response === 'No') aStats.No++;
      }

      let finHours = 0;
      for (const e of events) if ((e.status || '').toLowerCase() === 'completed') finHours += hoursBetween(e.start, e.end);

      setEventDocs(events);
      setInquiryDocs(inquiries);
      setAvailabilityDocs(availability);
      setEventStats(eStats);
      setInquiryStats(iStats as any);
      setAvailabilityStats(aStats);
      setFinanceHours(finHours);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to fetch report data');
      setEventDocs([]);
      setInquiryDocs([]);
      setAvailabilityDocs([]);
      setEventStats({ total: 0, published: 0, canceled: 0, completed: 0 });
      setInquiryStats({ Submitted: 0, Accepted: 0, Booked: 0, Completed: 0 });
      setAvailabilityStats({ total: 0, Yes: 0, Maybe: 0, No: 0 });
      setFinanceHours(0);
    } finally { setLoading(false); }
  }, [startDate, endDate]);

  React.useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleExportCSV = () => {
    try {
      const header = '\uFEFF';
      const lines = [
        'Metric,Value',
        `Events Total,${eventStats.total}`,
        `Events Published,${eventStats.published}`,
        `Events Canceled,${eventStats.canceled}`,
        `Events Completed,${eventStats.completed}`,
        `Inquiries Submitted,${inquiryStats.Submitted}`,
        `Inquiries Accepted,${inquiryStats.Accepted}`,
        `Inquiries Booked,${inquiryStats.Booked}`,
        `Inquiries Completed,${inquiryStats.Completed}`,
        `Availability Total,${availabilityStats.total}`,
        `Availability Yes,${availabilityStats.Yes}`,
        `Availability Maybe,${availabilityStats.Maybe}`,
        `Availability No,${availabilityStats.No}`,
        `Finance Approved Hours (approx),${financeHours}`,
      ];
      const csv = header + lines.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'tallies.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { console.error('CSV export failed:', e); }
  };

  const openFinalize = async (ev: BaseDoc) => {
    setSelectedEvent(ev);
    setDrawerOpen(true);
    const baseQ = query(collection(db, 'availability'), where('eventId', '==', ev.id));
    const snap = await getDocs(baseQ);
    const rows: FinalizeRow[] = snap.docs
      .map((d) => d.data() as any)
      .filter((data) => {
        const raw = data.status ?? data.response;
        const s = typeof raw === 'string' ? raw.toLowerCase() : '';
        return s === 'yes' || s === 'going' || s === 'attending';
      })
      .map((data) => ({ uid: data.uid, name: data.displayName || data.name || data.email || data.uid, approved: false }));
    setFinalizeRows(rows);
  };

  const toggleApprove = (uid: string) => setFinalizeRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, approved: !r.approved } : r)));

  const finalizeEvent = async () => {
    if (!selectedEvent) return;
    setFinalizing(true);
    try {
      const hours = hoursBetween(selectedEvent.start, selectedEvent.end);
      const approved = finalizeRows.filter((r) => r.approved);

      await Promise.all(
        approved.map((r) => {
          const payRef = doc(db, 'events', selectedEvent.id, 'payments', r.uid);
          const payload = {
            uid: r.uid,
            name: r.name,
            eventId: selectedEvent.id,
            eventTitle: selectedEvent.title || 'Untitled Event',
            eventDate: toDate(selectedEvent.date) ?? null,
            hours,
            approvedAt: serverTimestamp(),
          };
          return setDoc(payRef, payload, { merge: true });
        })
      );

      await updateDoc(doc(db, 'events', selectedEvent.id), { status: 'completed', completedAt: serverTimestamp() } as any);
      await fetchCounts();
      setDrawerOpen(false); setSelectedEvent(null); setFinalizeRows([]);
    } catch (e) { console.error('Finalize failed', e); setError('Finalize failed. See console.'); }
    finally { setFinalizing(false); }
  };

  return (
    <section className="reports stack">
      <header className="stack">
        <h1 className="title">Reports</h1>
        <p className="lede">Tallies for Events, Inquiries, Availability — with event finalization.</p>
      </header>

      <div className="toolbar">
        <div className="left">
          <label className="field"><span>From</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="field"><span>To</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>
        <div className="right">
          <button className="btn" onClick={handleExportCSV} disabled={loading}>Export CSV</button>
          <button className="btn btn-secondary" onClick={fetchCounts} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="grid cols-3 stack-md">
        <article className="card stat">
          <h3>Events</h3>
          <p className="muted">Total (range): {eventStats.total}</p>
          <div className="pill-row"><span className="badge submitted">Published</span><strong>{eventStats.published}</strong></div>
          <div className="pill-row"><span className="badge canceled">Canceled</span><strong>{eventStats.canceled}</strong></div>
          <div className="pill-row"><span className="badge completed">Completed</span><strong>{eventStats.completed}</strong></div>
        </article>

        <article className="card stat">
          <h3>Inquiries Funnel</h3>
          <p className="muted">Total: {Object.values(inquiryStats).reduce((a, b) => a + b, 0)}</p>
          <div className="pill-row"><span className="badge submitted">Submitted</span><strong>{inquiryStats.Submitted}</strong></div>
          <div className="pill-row"><span className="badge accepted">Accepted</span><strong>{inquiryStats.Accepted}</strong></div>
          <div className="pill-row"><span className="badge booked">Booked</span><strong>{inquiryStats.Booked}</strong></div>
          <div className="pill-row"><span className="badge completed">Completed</span><strong>{inquiryStats.Completed}</strong></div>
        </article>

        <article className="card stat">
          <h3>Availability</h3>
          <p className="muted">Total responses: {availabilityStats.total}</p>
          <div className="pill-row"><span className="badge yes">Yes</span><strong>{availabilityStats.Yes}</strong></div>
          <div className="pill-row"><span className="badge maybe">Maybe</span><strong>{availabilityStats.Maybe}</strong></div>
          <div className="pill-row"><span className="badge no">No</span><strong>{availabilityStats.No}</strong></div>
        </article>
      </div>

      <section className="card stack">
        <h3>Events in Range</h3>
        <div className="table">
          <div className="row head">
            <div>Date</div><div>Title</div><div>Status</div><div>Duration</div><div>Actions</div>
          </div>
          {loading && <div className="row message"><div className="full">Loading…</div></div>}
          {!loading && eventDocs.length === 0 && <div className="row message"><div className="full">No events.</div></div>}
          {!loading && eventDocs.map((e) => (
            <div className="row" key={e.id}>
              <div>{e.date ? e.date.toLocaleDateString() : '—'}</div>
              <div>{e.title || '—'}</div>
              <div><span className={`badge ${String(e.status || 'unknown').toLowerCase()}`}>{e.status || '—'}</span></div>
              <div>{hoursBetween(e.start, e.end)} hr</div>
              <div><button className="btn sm" onClick={() => openFinalize(e)} disabled={!e.id}>Manage</button></div>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>Recent (Events • Inquiries • Availability)</h3>
        <div className="table">
          <div className="row head"><div>Date</div><div>Type</div><div>Title</div><div>Status/Response</div></div>
          {loading && <div className="row message"><div className="full">Loading…</div></div>}
          {!loading && eventDocs.length + inquiryDocs.length + availabilityDocs.length === 0 && (
            <div className="row message"><div className="full">No items for selected range.</div></div>
          )}
          {!loading && (
            <>
              {eventDocs.map((e) => (
                <div className="row" key={`e-${e.id}`}>
                  <div>{e.date ? e.date.toLocaleDateString() : '—'}</div>
                  <div>Event</div>
                  <div>{e.title || '—'}</div>
                  <div><span className={`badge ${String(e.status || 'unknown').toLowerCase()}`}>{e.status || '—'}</span></div>
                </div>
              ))}
              {inquiryDocs.map((q) => (
                <div className="row" key={`q-${q.id}`}>
                  <div>{q.date ? q.date.toLocaleDateString() : '—'}</div>
                  <div>Inquiry</div>
                  <div>{q.title || '—'}</div>
                  <div><span className={`badge ${String(q.status || 'unknown').toLowerCase()}`}>{q.status || '—'}</span></div>
                </div>
              ))}
              {availabilityDocs.map((r) => (
                <div className="row" key={`r-${r.id}`}>
                  <div>{r.date ? r.date.toLocaleDateString() : '—'}</div>
                  <div>Availability</div>
                  <div>{r.title || r.eventId || '—'}</div>
                  <div><span className={`badge ${String(r.response || 'unknown').toLowerCase()}`}>{r.response || '—'}</span></div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {drawerOpen && selectedEvent && (
        <div className="drawer-backdrop" role="dialog" aria-modal onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="drawer-title">Finalize: {selectedEvent.title}</div>
                <div className="drawer-meta">
                  {toDate(selectedEvent.start)?.toLocaleString() ?? '—'}
                  {selectedEvent.end ? ` – ${toDate(selectedEvent.end)?.toLocaleTimeString()}` : ''}
                  {selectedEvent.location ? ` • ${selectedEvent.location}` : ''}
                </div>
              </div>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="drawer-body">
              <p className="muted">YES RSVPs — check whom to approve for payment.</p>
              <div className="table">
                <div className="row head"><div>Approve</div><div>Performer</div></div>
                {finalizeRows.length === 0 && (<div className="row message"><div className="full">No YES RSVPs found.</div></div>)}
                {finalizeRows.map((r) => (
                  <div key={r.uid} className="row">
                    <div><input type="checkbox" checked={r.approved} onChange={() => toggleApprove(r.uid)} aria-label={`Approve ${r.name}`} /></div>
                    <div>{r.name}</div>
                  </div>
                ))}
              </div>
              <div className="stack">
                <div className="muted">Duration: {hoursBetween(selectedEvent.start, selectedEvent.end)} hr</div>
                <button className="btn-primary" onClick={finalizeEvent} disabled={finalizing || finalizeRows.every(r => !r.approved)}>
                  {finalizing ? 'Finalizing…' : 'Finalize & Write Payments'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Reports;
