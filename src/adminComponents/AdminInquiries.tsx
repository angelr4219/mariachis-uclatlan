// =============================================
// FILE: src/pages/admin/AdminInquiries.tsx
// Desc: Admin-only page: list inquiries, Accept → publish/create event & REMOVE inquiry, Decline → delete inquiry (+draft event)
// =============================================
import React from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  where,
  getDocs,
  limit,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import './AdminInquiries.css';

// Firestore document shape for inquiries (subset)
export type InquiryDoc = {
  kind?: 'performanceInquiry';
  status?: 'new' | 'in_progress' | 'closed';
  name: string;
  email: string;
  phone?: string | null;
  org?: string;
  message?: string; // client notes
  eventTitle?: string; // legacy/optional title
  eventDate?: string; // legacy YYYY-MM-DD
  startTime?: string; // legacy HH:MM
  endTime?: string;   // legacy HH:MM
  event?: {
    title?: string;
    date?: string; // YYYY-MM-DD
    start?: string | Timestamp; // ISO or Timestamp
    end?: string | Timestamp;   // ISO or Timestamp
    location?: string;
  };
  eventId?: string; // created at intake; may be absent for older docs
  durationMinutes?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type InquiryItem = InquiryDoc & { id: string };

function toIso(val?: string | Timestamp | null): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return undefined;
}

const fmtHM = (s?: string) => (s && s.length >= 5 ? s.slice(0,5) : undefined);

async function deleteCalendarFeedBySourceId(sourceId: string) {
  const qCf = query(collection(db, 'calendar_feed'), where('sourceId', '==', sourceId));
  const snap = await getDocs(qCf);
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'calendar_feed', d.id))));
}

const AdminInquiries: React.FC = () => {
  const [items, setItems] = React.useState<InquiryItem[]>([]);
  const [busy, setBusy] = React.useState<string>('');
  const [err, setErr] = React.useState<string>('');

  React.useEffect(() => {
    const qInq = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      qInq,
      (snap) => {
        const arr: InquiryItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as any;
        setItems(arr);
      },
      (e) => setErr(e?.message || 'Failed to load inquiries')
    );
    return () => unsub();
  }, []);

  const accept = async (inq: InquiryItem) => {
    try {
      setBusy(inq.id); setErr('');

      // If an event draft already exists, publish it; else create a new event
      let eventId = inq.eventId;
      if (eventId) {
        const evRef = doc(db, 'events', eventId);
        const evSnap = await getDoc(evRef);
        if (evSnap.exists()) {
          await updateDoc(evRef, { status: 'published', updatedAt: serverTimestamp() });
        } else {
          eventId = undefined; // fall back to create
        }
      }

      if (!eventId) {
        const ev = inq.event || {};
        // Prefer Timestamp→ISO. Fall back to legacy flat fields.
        const startIso = toIso(ev.start) || (inq.eventDate && inq.startTime ? `${inq.eventDate}T${inq.startTime}:00` : (ev.date ? `${ev.date}T12:00:00` : undefined));
        const endIso = toIso(ev.end) || (inq.eventDate && inq.endTime ? `${inq.eventDate}T${inq.endTime}:00` : undefined);
        const startTs = startIso ? Timestamp.fromDate(new Date(startIso)) : null;
        const endTs = endIso ? Timestamp.fromDate(new Date(endIso)) : null;
        const payload = {
          title: ev.title || inq.eventTitle || 'Client Performance',
          start: startTs,
          end: endTs,
          location: ev.location || '',
          status: 'published' as const,
          source: 'inquiry',
          sourceId: inq.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          durationMinutes: inq.durationMinutes ?? null,
          client: { name: inq.name, email: inq.email, phone: inq.phone ?? null },
        };
        const ref = await addDoc(collection(db, 'events'), payload);
        eventId = ref.id;
      }

      // After accepting, remove the inquiry to keep the inbox clean
      await deleteDoc(doc(db, 'inquiries', inq.id));
      // Optional: also remove any calendar_feed stub for this inquiry
      await deleteCalendarFeedBySourceId(inq.id);

    } catch (e: any) {
      console.error('[accept inquiry]', e);
      setErr(e?.message || 'Failed to accept request');
    } finally {
      setBusy('');
    }
  };

  const decline = async (inq: InquiryItem) => {
    try {
      setBusy(inq.id); setErr('');
      // If a related event exists (draft), remove it
      if (inq.eventId) {
        await deleteDoc(doc(db, 'events', inq.eventId));
      }
      // Remove inquiry entirely to avoid duplicates/backlog
      await deleteDoc(doc(db, 'inquiries', inq.id));
      // Clean calendar_feed entries
      await deleteCalendarFeedBySourceId(inq.id);
    } catch (e: any) {
      console.error('[decline inquiry]', e);
      setErr(e?.message || 'Failed to decline request');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="admin-inquiries ucla-content">
      <h1 className="ucla-heading-xl">Performance Requests</h1>
      <p>Review client inquiries. Accept to publish the related event (and remove from inbox); Decline to delete the request.</p>
      {err && <p className="err" role="alert">{err}</p>}

      <div className="inq-list">
        {items.map((it) => {
          const ev = it.event || {};
          const startIso = toIso(ev.start) || (it.eventDate && it.startTime ? `${it.eventDate}T${it.startTime}:00` : undefined);
          const endIso = toIso(ev.end) || (it.eventDate && it.endTime ? `${it.eventDate}T${it.endTime}:00` : undefined);
          const dateStr = ev.date || it.eventDate || (startIso ? startIso.slice(0,10) : '—');
          const timeStr = `${startIso ? startIso.slice(11,16) : (fmtHM(it.startTime) || '—')}${endIso ? ` – ${endIso.slice(11,16)}` : (fmtHM(it.endTime) ? ` – ${fmtHM(it.endTime)}` : '')}`;
          const dur = it.durationMinutes ??
            (startIso && endIso ? Math.round((new Date(endIso).getTime() - new Date(startIso).getTime())/60000) : undefined);

          return (
            <article key={it.id} className={`inq-card status-${it.status || 'new'}`}>
              <header className="inq-head">
                <div>
                  <h3>{ev.title || it.eventTitle || 'Client Inquiry'}</h3>
                  <div className="muted">From: {it.name} • {it.email}{it.org ? ` • ${it.org}` : ''}</div>
                </div>
                <span className={`chip ${it.status || 'new'}`}>{it.status || 'new'}</span>
              </header>

              <dl className="grid">
                <div>
                  <dt>Date</dt>
                  <dd>{dateStr}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{timeStr}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{dur !== undefined ? `${Math.floor(dur/60)}h ${dur%60}m` : '—'}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{ev.location || '—'}</dd>
                </div>
                <div className="span-2">
                  <dt>Notes</dt>
                  <dd>{it.message || (it as any).details || '—'}</dd>
                </div>
              </dl>

              <footer className="actions">
                <button className="btn" disabled={busy === it.id} onClick={() => accept(it)}>Accept</button>
                <button className="btn btn-light" disabled={busy === it.id} onClick={() => decline(it)}>Decline</button>
              </footer>
            </article>
          );
        })}
      </div>

      {items.length === 0 && <p>No requests yet.</p>}
    </section>
  );
};

export default AdminInquiries;

