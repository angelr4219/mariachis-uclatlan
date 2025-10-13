// =============================================================
// FILE: src/pages/Members/ProfilePage.tsx
// Purpose: Card-first layout + My Inventory + inline RSVP edit + event details modal
// Notes:
//  - Reads flat availability by uid (single-field) and filters to status==='yes'
//  - Clicking a card opens a modal with event details (loaded from {source}/{eventId})
//  - Change availability for EVENTS directly from profile (writes:
//      events/{eventId}/availability/{uid}  +  availability/{source_eventId_uid})
//  - If source!=='events' (e.g., inquiries), RSVP edit is disabled by rules
// =============================================================
import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  doc,
  Timestamp,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import './Profile.css';

// ---------- types ----------
export type FlatAvailability = {
  id: string; // availability/{id}
  uid: string;
  displayName?: string;
  email?: string | null;
  status: 'yes' | 'maybe' | 'no';
  finalized?: boolean;
  updatedAt?: Timestamp;
  // denormalized event/meta
  eventId?: string;
  eventTitle?: string;
  eventStart?: Timestamp | Date | string | null;
  eventEnd?: Timestamp | Date | string | null;
  eventLocation?: string | null;
  source?: 'events' | 'inquiries';
};

export type TrajeItem = {
  id: string;
  type: string;
  size?: string;
  tag?: string;
  condition?: string;
  status?: string;
  assignedTo?: string | null;
  assignedAt?: Timestamp;
  notes?: string;
};

// ---------- helpers ----------
const toDate = (v: any): Date | null => {
  if (!v && v !== 0) return null;
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) return (v as Timestamp).toDate();
  const d = new Date(v); return isNaN(d.getTime()) ? null : d;
};

const fmtRange = (start: any, end: any): string => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s) return 'TBA';
  const dateOpts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  if (!e) return `${s.toLocaleDateString(undefined, dateOpts)} ${s.toLocaleTimeString(undefined, timeOpts)}`;
  const sameDay = s.toDateString() === e.toDateString();
  const left = `${s.toLocaleDateString(undefined, dateOpts)} ${s.toLocaleTimeString(undefined, timeOpts)}`;
  const right = sameDay ? e.toLocaleTimeString(undefined, timeOpts) : `${e.toLocaleDateString(undefined, dateOpts)} ${e.toLocaleTimeString(undefined, timeOpts)}`;
  return `${left} → ${right}`;
};

const fmtWhen = (ts?: Timestamp | Date | string | null): string => {
  const d = toDate(ts); if (!d) return '';
  return d.toLocaleString?.() || d.toISOString();
};

const eventImg = (source?: string) => source === 'inquiries' ? '/img/inquiry-card.jpg' : '/img/event-card.jpg';

// Safe path builder for event RSVP doc
function availabilityDocRef(source: 'events'|'inquiries', id: string, uid: string) {
  if (!id || id.includes('/')) throw new Error('bad id');
  return doc(db, source, id, 'availability', uid);
}

// ---------- component ----------
const Profile: React.FC = () => {
  const [user] = useAuthState(auth);
  const [accepted, setAccepted] = React.useState<FlatAvailability[]>([]);
  const [inventory, setInventory] = React.useState<TrajeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string>('');

  // modal state
  const [openId, setOpenId] = React.useState<string | null>(null); // availability doc id (flat)
  const [openMeta, setOpenMeta] = React.useState<any>(null); // event/inquiry document
  const current = React.useMemo(() => accepted.find(a => a.id === openId) || null, [accepted, openId]);

  React.useEffect(() => {
    const load = async () => {
      setErr(''); setLoading(true);
      try {
        if (!user) { setLoading(false); return; }
        // 1) Load availability rows for this user
        const aRef = collection(db, 'availability');
        const aSnap = await getDocs(query(aRef, where('uid', '==', user.uid)));
        const rows: FlatAvailability[] = aSnap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) })) as any;
        const yes = rows.filter(r => r.status === 'yes');
        yes.sort((a, b) => (toDate(a.eventStart)?.getTime() ?? 0) - (toDate(b.eventStart)?.getTime() ?? 0));
        setAccepted(yes);

        // 2) Load issued traje items
        const tRef = collection(db, 'trajes');
        const tSnap = await getDocs(query(tRef, where('assignedTo', '==', user.uid)));
        const items: TrajeItem[] = tSnap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) })) as any;
        setInventory(items.filter(it => it.status !== 'retired'));
      } catch (e: any) {
        console.error('[ProfilePage] load failed', e);
        setErr(e?.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  // Open modal & fetch full event/inquiry doc
  const openDetails = async (a: FlatAvailability) => {
    try {
      setOpenId(a.id);
      if (a.source && a.eventId) {
        const snap = await getDoc(doc(db, a.source, a.eventId));
        setOpenMeta(snap.exists() ? snap.data() : {});
      } else {
        setOpenMeta({});
      }
    } catch (e) {
      console.error('failed to load event details', e);
      setOpenMeta({});
    }
  };

  const closeDetails = () => { setOpenId(null); setOpenMeta(null); };

  // Save RSVP (events only)
  const saveRsvp = async (a: FlatAvailability, status: 'yes'|'maybe'|'no') => {
    if (!user || !a.eventId || a.source !== 'events') return;
    try {
      const subRef = availabilityDocRef('events', a.eventId, user.uid);
      const payload = {
        uid: user.uid,
        displayName: user.displayName || user.email || 'Unknown',
        email: user.email || null,
        status,
        updatedAt: serverTimestamp(),
        source: a.source,
        refId: a.eventId,
        eventId: a.eventId,
        eventTitle: a.eventTitle || (openMeta?.title ?? 'Untitled Event'),
        eventStart: a.eventStart ?? (openMeta?.start || null),
        eventEnd: a.eventEnd ?? (openMeta?.end || null),
        eventLocation: a.eventLocation ?? (openMeta?.location || null),
        finalized: a.finalized || false,
      } as const;

      await setDoc(subRef, payload, { merge: true });
      const flatId = `${a.source}_${a.eventId}_${user.uid}`;
      await setDoc(doc(db, 'availability', flatId), payload, { merge: true });

      // optimistic local update (and resort list if needed)
      setAccepted(prev => {
        const next = prev.map(x => x.id === a.id ? { ...x, status, updatedAt: Timestamp.now() as any } : x);
        next.sort((p, q) => (toDate(p.eventStart)?.getTime() ?? 0) - (toDate(q.eventStart)?.getTime() ?? 0));
        return next;
      });
    } catch (e) {
      console.error('saveRsvp failed', e);
      setErr('Could not save RSVP.');
    }
  };

  if (!user) {
    return (
      <section className="profile-wrap">
        <div className="inline-banner error"><span className="banner-icon">!</span><span>Please sign in to view your profile.</span></div>
      </section>
    );
  }

  return (
    <section className="profile-wrap">
      <header className="card profile-card profile-head">
        <div className="avatar">
          {user.photoURL ? (
            <img src={user.photoURL} alt="avatar" />
          ) : (
            <div className="avatar-placeholder">{(user.displayName || user.email || 'U')[0].toUpperCase()}</div>
          )}
        </div>
        <div className="id-block">
          <h2>{user.displayName || 'Member'}</h2>
          <div className="muted">{user.email}</div>
          <div className="roles">
            <span className="role-chip">Member</span>
          </div>
        </div>
        <div>{/* reserved for future quick-actions */}</div>
      </header>

      {err && (
        <div className="inline-banner error"><span className="banner-icon">!</span><span>{err}</span><button className="banner-dismiss" onClick={()=>setErr('')} aria-label="Dismiss">×</button></div>
      )}

      {loading && <p className="muted">Loading your events & inventory…</p>}

      {/* ---- Accepted Events (cards) ---- */}
      <h3 className="section-title">My Accepted Performances</h3>
      {(!loading && accepted.length === 0) && <p className="muted">No accepted performances yet.</p>}
      <div className="accepted-list">
        {accepted.map((a) => (
          <article key={a.id} className="accepted-card" onClick={() => openDetails(a)} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter') openDetails(a); }}>
            <div className="accepted-head">
              <h4 className="accepted-title">{a.eventTitle || 'Untitled'}</h4>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {a.finalized && <span className="chip chip--final">Finalized</span>}
                {/* inline RSVP select (events only) */}
                <select
                  aria-label="Change availability"
                  value={a.status}
                  onClick={(e)=>e.stopPropagation()}
                  onChange={(e)=>{ e.stopPropagation(); saveRsvp(a, e.target.value as any); }}
                  disabled={a.finalized || a.source !== 'events'}
                >
                  <option value="yes">Yes</option>
                  <option value="maybe">Maybe</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            <img
              src={eventImg(a.source)}
              alt="event visual"
              className="card-img"
              onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}}
            />
            <dl className="accepted-meta">
              <div className="meta-row"><dt>When</dt><dd>{fmtRange(a.eventStart, a.eventEnd)}</dd></div>
              {!!a.eventLocation && <div className="meta-row"><dt>Where</dt><dd>{a.eventLocation}</dd></div>}
              {!!a.updatedAt && <div className="meta-row"><dt>Updated</dt><dd>{fmtWhen(a.updatedAt)}</dd></div>}
            </dl>
          </article>
        ))}
      </div>

      {/* ---- Inventory ---- */}
      <h3 className="section-title" style={{ marginTop: '1.25rem' }}>My Issued Traje Items</h3>
      {(!loading && inventory.length === 0) && <p className="muted">You currently have no issued items.</p>}
      <div className="accepted-list">
        {inventory.map((it) => (
          <article key={it.id} className="accepted-card">
            <div className="accepted-head">
              <h4 className="accepted-title">{it.type || 'Item'}</h4>
              <span className="chip">{it.status || 'assigned'}</span>
            </div>
            <dl className="accepted-meta">
              {it.tag && <div className="meta-row"><dt>Tag</dt><dd>{it.tag}</dd></div>}
              {it.size && <div className="meta-row"><dt>Size</dt><dd>{it.size}</dd></div>}
              {it.condition && <div className="meta-row"><dt>Cond.</dt><dd>{it.condition}</dd></div>}
              {it.assignedAt && <div className="meta-row"><dt>Since</dt><dd>{fmtWhen(it.assignedAt)}</dd></div>}
              {it.notes && <div className="meta-row"><dt>Notes</dt><dd>{it.notes}</dd></div>}
            </dl>
          </article>
        ))}
      </div>

      {/* ---- Modal: Event Details ---- */}
      {current && (
        <div className="modal-backdrop" onClick={closeDetails}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Event details" onClick={(e)=>e.stopPropagation()}>
            <header className="modal-head">
              <h4 className="modal-title">{current.eventTitle || 'Event'}</h4>
              <button className="modal-close" onClick={closeDetails} aria-label="Close">×</button>
            </header>
            <div className="modal-body">
              <p className="muted">{current.source === 'events' ? 'Event' : 'Inquiry'} • {fmtRange(current.eventStart, current.eventEnd)}</p>
              {current.eventLocation && <p><strong>Location:</strong> {current.eventLocation}</p>}
              {openMeta?.description && <p className="multi">{openMeta.description}</p>}
              {!openMeta?.description && <p className="muted">No description provided.</p>}

              <div style={{ marginTop: 12 }}>
                <label className="field"><span>My Availability</span>
                  <select
                    value={current.status}
                    onChange={(e)=>saveRsvp(current, e.target.value as any)}
                    disabled={current.finalized || current.source !== 'events'}
                  >
                    <option value="yes">Yes</option>
                    <option value="maybe">Maybe</option>
                    <option value="no">No</option>
                  </select>
                </label>
                {current.finalized && <div className="inline-banner error" style={{marginTop:8}}>This RSVP was finalized by an admin.</div>}
                {current.source !== 'events' && <div className="inline-banner error" style={{marginTop:8}}>Availability can only be submitted on confirmed events.</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Profile;
