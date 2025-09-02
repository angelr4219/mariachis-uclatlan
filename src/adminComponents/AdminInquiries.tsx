// =============================================
// FILE: src/pages/admin/AdminInquiries.tsx
// Desc: Admin-only page: list inquiries, Accept → creates event, Decline → closes
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
} from 'firebase/firestore';
import { db } from '../firebase';
import './AdminInquiries.css';

// Firestore document shape for inquiries (subset)
export type InquiryDoc = {
  name: string;
  email: string;
  phone?: string;
  org?: string;
  message?: string;
  status?: 'new' | 'in_progress' | 'closed';
  event?: {
    title?: string;
    date?: string;  // YYYY-MM-DD
    start?: string | Timestamp; // ISO or Timestamp
    end?: string | Timestamp;   // ISO or Timestamp
    location?: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type InquiryItem = InquiryDoc & { id: string };

function toIso(val?: string | Timestamp): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return undefined;
}

async function updateCalendarFeedStatusBySourceId(sourceId: string, status: 'new'|'in_progress'|'closed') {
  const q = query(collection(db, 'calendar_feed'), where('sourceId', '==', sourceId), limit(1));
  const snap = await getDocs(q);
  const d = snap.docs[0];
  if (d) {
    await updateDoc(doc(db, 'calendar_feed', d.id), { status, updatedAt: serverTimestamp() });
  }
}

const AdminInquiries: React.FC = () => {
  const [items, setItems] = React.useState<InquiryItem[]>([]);
  const [busy, setBusy] = React.useState<string>(''); // holds inquiry id while acting
  const [err, setErr] = React.useState<string>('');

  React.useEffect(() => {
    const qInq = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(qInq, (snap) => {
      const arr: InquiryItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as any;
      setItems(arr);
    }, (e) => setErr(e?.message || 'Failed to load inquiries'));
    return () => unsub();
  }, []);

  const accept = async (inq: InquiryItem) => {
    try {
      setBusy(inq.id); setErr('');
      const ev = inq.event || {};
      const startIso = toIso(ev.start) || (ev.date ? new Date(`${ev.date}T12:00:00`).toISOString() : undefined);
      const endIso = toIso(ev.end);
      const payload = {
        title: ev.title || 'Client Performance',
        date: ev.date || undefined,
        start: startIso,
        end: endIso,
        location: ev.location || '',
        status: 'published', // visible to members/public per your rules
        source: 'inquiry',
        sourceId: inq.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'events'), payload);

      // mark inquiry as in_progress and link the event id
      await updateDoc(doc(db, 'inquiries', inq.id), {
        status: 'in_progress',
        eventId: ref.id,
        updatedAt: serverTimestamp(),
      });

      // update public calendar stub if present
      await updateCalendarFeedStatusBySourceId(inq.id, 'in_progress');
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
      await updateDoc(doc(db, 'inquiries', inq.id), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      });
      await updateCalendarFeedStatusBySourceId(inq.id, 'closed');
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
      <p>Review client inquiries. Accept to create an Event; Decline to close.</p>
      {err && <p className="err" role="alert">{err}</p>}

      <div className="inq-list">
        {items.map((it) => {
          const ev = it.event || {};
          return (
            <article key={it.id} className={`inq-card status-${it.status || 'new'}`}>
              <header className="inq-head">
                <div>
                  <h3>{ev.title || 'Client Inquiry'}</h3>
                  <div className="muted">From: {it.name} • {it.email}{it.org ? ` • ${it.org}` : ''}</div>
                </div>
                <span className={`chip ${it.status || 'new'}`}>{it.status || 'new'}</span>
              </header>

              <dl className="grid">
                <div>
                  <dt>Date</dt>
                  <dd>{ev.date || (typeof ev.start === 'string' ? ev.start.slice(0,10) : '') || '—'}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{(toIso(ev.start)?.slice(11,16) || '—') + (toIso(ev.end) ? ` – ${toIso(ev.end)!.slice(11,16)}` : '')}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{ev.location || '—'}</dd>
                </div>
                <div className="span-2">
                  <dt>Notes</dt>
                  <dd>{it.message || '—'}</dd>
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

