
// =============================================
// FILE: src/pages/admin/PerformanceDaySetup.tsx
// Purpose: Admin-only tool to view availability, approve performers, and trigger SMS scheduling
// Notes:
//  - Reads events (published/upcoming) and their availability subcollections
//  - On approve, writes events/{eventId}/assignments/{uid} and calls a callable Function to send/schedule SMS
//  - Assumes users/{uid} has phoneNumber and optional traje numbers (jacket/vest/pants)
// =============================================
import React from 'react';
import './PerformanceDaySetup.css';
import { Timestamp, collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// Types
interface EventDoc {
  id: string;
  title: string;
  start?: Timestamp | string | Date | null;
  end?: Timestamp | string | Date | null;
  location?: string;
  status?: string;
}

interface AvailabilityDoc {
  uid: string;
  status: 'yes' | 'maybe' | 'no';
  displayName?: string;
  email?: string;
  phoneNumber?: string | null; // may be missing here
}

interface UserProfile {
  uid: string;
  name?: string;
  email?: string;
  phoneNumber?: string | null;
  traje?: { jacket?: string; vest?: string; pants?: string } | null;
  trajeJacket?: string; // legacy single fields supported too
  trajeVest?: string;
  trajePants?: string;
}

const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  try { const d = new Date(v); return isNaN(d.getTime()) ? undefined : d; } catch { return undefined; }
};

const dtLocalValue = (d?: Date) => d ? new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16) : '';

const PerformanceDaySetup: React.FC = () => {
  const [events, setEvents] = React.useState<EventDoc[]>([]);
  const [selectedEventId, setSelectedEventId] = React.useState<string>('');
  const [availability, setAvailability] = React.useState<(AvailabilityDoc & { profile?: UserProfile })[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});
  const [pickupAt, setPickupAt] = React.useState<Record<string, string>>({}); // per-uid datetime-local

  // Load upcoming published events
  React.useEffect(() => {
    (async () => {
      const qRef = query(collection(db, 'events'), where('status','==','published'));
      const snap = await getDocs(qRef);
      const now = Date.now();
      const rows: EventDoc[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter(e => (toDate(e.start)?.getTime() ?? 0) >= now - 2*60*60*1000) // small buffer
        .sort((a,b)=> (toDate(a.start)?.getTime()||0) - (toDate(b.start)?.getTime()||0));
      setEvents(rows);
      if (rows[0]) setSelectedEventId(rows[0].id);
    })();
  }, []);

  // Load availability for selected event (and enrich with profiles)
  React.useEffect(() => {
    if (!selectedEventId) { setAvailability([]); return; }
    (async () => {
      setLoading(true);
      try {
        const sub = collection(db, 'events', selectedEventId, 'availability');
        const snap = await getDocs(sub);
        const base = snap.docs.map(d => ({ uid: d.id, ...(d.data() as any) })) as AvailabilityDoc[];
        const yesOrMaybe = base.filter(x => x.status === 'yes' || x.status === 'maybe');
        const profs = await Promise.all(yesOrMaybe.map(async (a) => {
          const pdoc = await getDoc(doc(db, 'users', a.uid));
          const profile = pdoc.exists() ? ({ uid: a.uid, ...(pdoc.data() as any) } as UserProfile) : undefined;
          return { ...a, profile };
        }));
        setAvailability(profs);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedEventId]);

  const approve = async (uid: string) => {
    if (!selectedEventId) return;
    const row = availability.find(a => a.uid === uid);
    const ev = events.find(e => e.id === selectedEventId);
    const pickup = pickupAt[uid] ? new Date(pickupAt[uid]) : undefined;

    setSaving(s => ({ ...s, [uid]: true }));
    try {
      const phone = row?.phoneNumber || row?.profile?.phoneNumber || null;
      const traje = row?.profile?.traje || {
        jacket: row?.profile?.trajeJacket,
        vest: row?.profile?.trajeVest,
        pants: row?.profile?.trajePants,
      };

      // Write assignment doc
      await setDoc(doc(db, 'events', selectedEventId, 'assignments', uid), {
        approved: true,
        approvedAt: Timestamp.now(),
        uid,
        eventId: selectedEventId,
        eventTitle: ev?.title || 'Untitled Event',
        eventStart: ev?.start instanceof Timestamp ? ev.start : (toDate(ev?.start) ? Timestamp.fromDate(toDate(ev?.start)!) : null),
        eventLocation: ev?.location || null,
        phoneNumber: phone,
        trajeNumbers: traje || null,
        trajePickupAt: pickup ? Timestamp.fromDate(pickup) : null,
      }, { merge: true });

      // Call backend to send immediate SMS + schedule T-1d and T-2h
      const callable = httpsCallable(functions, 'scheduleEventSms');
      await callable({
        eventId: selectedEventId,
        uid,
        overridePhone: phone,
        trajePickupAt: pickup ? pickup.toISOString() : null,
      });

      alert('Approved & SMS scheduled');
    } catch (e:any) {
      console.error(e);
      alert(e?.message || 'Failed to approve');
    } finally {
      setSaving(s => ({ ...s, [uid]: false }));
    }
  };

  return (
    <section className="perf-setup ucla-content">
      <h1 className="ucla-heading-xl">Performance Day Setup</h1>
      <p className="ucla-paragraph">Review availability, approve performers, and schedule SMS notices.</p>

      <div className="bar">
        <label>
          <span>Select event</span>
          <select value={selectedEventId} onChange={(e)=>setSelectedEventId(e.target.value)}>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.title} — {toDate(e.start)?.toLocaleString?.()}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p>Loading availability…</p> : (
        <table className="grid-table">
          <thead>
            <tr>
              <th>Performer</th>
              <th>Status</th>
              <th>Phone</th>
              <th>Prev. Traje</th>
              <th>Pickup</th>
              <th>Approve</th>
            </tr>
          </thead>
          <tbody>
            {availability.map(a => {
              const name = a.displayName || a.profile?.name || a.email || a.profile?.email || a.uid;
              const phone = a.phoneNumber || a.profile?.phoneNumber || '';
              const tj = a.profile?.traje || { jacket: a.profile?.trajeJacket, vest: a.profile?.trajeVest, pants: a.profile?.trajePants };
              return (
                <tr key={a.uid}>
                  <td>{name}</td>
                  <td><span className={`pill ${a.status}`}>{a.status}</span></td>
                  <td>{phone || <em>missing</em>}</td>
                  <td className="mono">J:{tj?.jacket||'-'} V:{tj?.vest||'-'} P:{tj?.pants||'-'}</td>
                  <td>
                    <input
                      type="datetime-local"
                      value={pickupAt[a.uid] || ''}
                      onChange={(e)=>setPickupAt(p => ({ ...p, [a.uid]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <button className="btn primary" disabled={!!saving[a.uid]} onClick={()=>approve(a.uid)}>
                      {saving[a.uid] ? 'Saving…' : 'Approve + SMS'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!availability.length && (
              <tr><td colSpan={6}><em>No yes/maybe responses yet for this event.</em></td></tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default PerformanceDaySetup;

