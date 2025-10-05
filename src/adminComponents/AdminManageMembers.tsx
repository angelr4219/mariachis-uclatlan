// =============================================================
// FILE: src/adminComponents/AdminManageMembers.tsx (UPDATED)
// Purpose: Manage roles + per-user permission + ADMIN RSVP FINALIZATION
// - Adds a per-member drawer/modal where admins can set RSVP per event
// - Finalized RSVPs (finalized: true) lock the member's own ability to change
// - Persists to events/{eventId}/availability/{uid} and mirrors to `availability`
//   with the `finalized` flag for reporting and member Profile page
// - Keeps existing Role management and search UX
// =============================================================
import React from 'react';
import { useUsersRoster } from '../pages/hooks/useUserRoster';
import { updateUserRoles, coerceRoles } from '../services/users';
import RoleBadge from '../pages/admin/RoleBadge';
import RoleSelect from '../pages/admin/RoleSelect';
import { primaryRole, type Role } from '../types/user';
import { db } from '../firebase';
import {
  doc,
  setDoc,
  collection,
  getDocs,
  getDoc,
  where,
  query,
  Timestamp,
  type CollectionReference,
} from 'firebase/firestore';
import './AdminManageMembers.css';

export type Profile = ReturnType<typeof useUsersRoster>['profiles'][number];

type ToggleProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label?: string;
};

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled, label }) => {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'on' : ''}`}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      title={label}
    >
      <span className="knob" />
    </button>
  );
};

// ---------- Local helpers ----------
export type EventItem = {
  id: string;
  title: string;
  start?: Date | Timestamp | string | null;
  end?: Date | Timestamp | string | null;
  status?: 'draft' | 'published' | 'cancelled' | string;
  location?: string;
};

type RSVP = 'yes' | 'maybe' | 'no' | '';

const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  try { const d = new Date(v); return isNaN(d.getTime()) ? undefined : d; } catch { return undefined; }
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

// ---------- Member RSVP Drawer ----------
const MemberRsvpDrawer: React.FC<{
  member: Profile | null;
  open: boolean;
  onClose: () => void;
}> = ({ member, open, onClose }) => {
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [rsvps, setRsvps] = React.useState<Record<string, RSVP>>({});
  const [finalized, setFinalized] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!open || !member) return;
      setLoading(true);
      try {
        // Load published upcoming events
        const col = collection(db, 'events') as CollectionReference;
        const qRef = query(col, where('status', '==', 'published'));
        const snap = await getDocs(qRef);
        if (!alive) return;
        const all: EventItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        const now = Date.now();
        const upcoming = all
          .filter((ev) => {
            const s = toDate(ev.start)?.getTime();
            return typeof s === 'number' ? s >= now - 1000 * 60 * 60 * 24 : true;
          })
          .sort((a, b) => (toDate(a.start)?.getTime() ?? 0) - (toDate(b.start)?.getTime() ?? 0));

        // Seed select values and load member's RSVP docs in parallel
        const seed: Record<string, RSVP> = {};
        const seedFinal: Record<string, boolean> = {};
        upcoming.forEach((ev) => { seed[ev.id] = ''; seedFinal[ev.id] = false; });

        const docs = await Promise.all(
          upcoming.map((ev) => getDoc(doc(db, 'events', ev.id, 'availability', member.uid)))
        );
        if (!alive) return;
        const next = { ...seed };
        const nextFinal = { ...seedFinal };
        docs.forEach((d, i) => {
          if (d.exists()) {
            const data: any = d.data();
            next[upcoming[i].id] = (data.status as RSVP) || '';
            nextFinal[upcoming[i].id] = Boolean(data.finalized);
          }
        });

        setEvents(upcoming);
        setRsvps(next);
        setFinalized(nextFinal);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [open, member]);

  const onChange = (eventId: string, value: RSVP) => {
    setRsvps((m) => ({ ...m, [eventId]: value }));
  };

  const onToggleFinal = (eventId: string, v: boolean) => {
    setFinalized((m) => ({ ...m, [eventId]: v }));
  };

  const saveOne = async (ev: EventItem) => {
    if (!member) return;
    const status = (rsvps[ev.id] || '') as RSVP;
    if (!status) return;
    setBusy((b) => ({ ...b, [ev.id]: true }));
    try {
      const finalizedFlag = Boolean(finalized[ev.id]);
      const payload = {
        uid: member.uid,
        displayName: member.name || member.email || 'Unknown',
        email: member.email || null,
        status, // 'yes' | 'maybe' | 'no'
        updatedAt: Timestamp.now(),
        eventId: ev.id,
        eventTitle: ev.title || 'Untitled Event',
        eventStart: toDate(ev.start) ? Timestamp.fromDate(toDate(ev.start)!) : null,
        eventEnd: toDate(ev.end) ? Timestamp.fromDate(toDate(ev.end)!) : null,
        eventLocation: (ev as any).location || null,
        finalized: finalizedFlag,
        finalizedBy: 'admin',
        finalizedAt: finalizedFlag ? Timestamp.now() : null,
      } as const;

      // Write subcollection doc
      const subRef = doc(db, 'events', ev.id, 'availability', member.uid);
      await setDoc(subRef, payload, { merge: true });

      // Mirror to flat collection used by Profile/Reports (we use `availability` in this codebase)
      const flatId = `${ev.id}_${member.uid}`;
      const flatRef = doc(db, 'availability', flatId);
      await setDoc(flatRef, payload, { merge: true });
    } finally {
      setBusy((b) => ({ ...b, [ev.id]: false }));
    }
  };

  return (
    <div className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="Manage Member RSVPs">
        <div className="drawer-head">
          <div className="drawer-title">
            <div className="avatar sm">
              {(member?.photoURL) ? (
                <img src={member.photoURL as any} alt="avatar" />
              ) : (
                <div className="avatar-placeholder">{(member?.name || member?.email || 'U')[0].toUpperCase()}</div>
              )}
            </div>
            <div>
              <h3>{member?.name || 'Member'}</h3>
              <p className="muted">{member?.email}</p>
            </div>
          </div>
          <button className="btn btn-light" onClick={onClose}>Close</button>
        </div>

        <div className="drawer-body">
          {loading && <p className="muted">Loading events…</p>}
          {!loading && !events.length && <p className="muted">No upcoming events.</p>}

          <div className="event-list">
            {events.map((ev) => (
              <article className="event-card" key={ev.id}>
                <header className="event-head">
                  <h4>{ev.title || 'Untitled Event'}</h4>
                  <span className={`status-pill ${ev.status}`}>{ev.status}</span>
                </header>
                <dl className="event-meta">
                  <div className="meta-row"><dt>When</dt><dd>{fmtRange(ev.start, ev.end) || 'TBA'}</dd></div>
                  {(ev as any).location && (
                    <div className="meta-row"><dt>Where</dt><dd>{(ev as any).location}</dd></div>
                  )}
                </dl>

                <div className="event-actions">
                  <label className="sr-only" htmlFor={`sel-${member?.uid}-${ev.id}`}>RSVP for {ev.title}</label>
                  <select
                    id={`sel-${member?.uid}-${ev.id}`}
                    value={rsvps[ev.id] || ''}
                    onChange={(e) => onChange(ev.id, e.target.value as RSVP)}
                  >
                    <option value="">Select…</option>
                    <option value="yes">Yes</option>
                    <option value="maybe">Maybe</option>
                    <option value="no">No</option>
                  </select>

                  <label className="finalize-toggle">
                    <input
                      type="checkbox"
                      checked={!!finalized[ev.id]}
                      onChange={(e) => onToggleFinal(ev.id, e.target.checked)}
                    />
                    <span>Finalize</span>
                  </label>

                  <button
                    className="btn-primary"
                    disabled={!!busy[ev.id] || !(rsvps[ev.id] || '')}
                    onClick={() => saveOne(ev)}
                  >
                    {busy[ev.id] ? 'Saving…' : 'Save'}
                  </button>
                </div>

                {finalized[ev.id] && (
                  <p className="finalized-note">This RSVP will be locked for the performer.</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Main table ----------
const AdminManageMembers: React.FC = () => {
  const { profiles, loading, error } = useUsersRoster();
  const [search, setSearch] = React.useState('');
  const [busy, setBusy] = React.useState<Record<string, boolean>>({});

  const [selected, setSelected] = React.useState<Profile | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const filtered = React.useMemo<Profile[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p: Profile) => {
      const name = (p.name ?? '').toLowerCase();
      const email = (p.email ?? '').toLowerCase();
      const instruments = (p.instruments ?? []).join(', ').toLowerCase();
      return name.includes(q) || email.includes(q) || instruments.includes(q);
    });
  }, [profiles, search]);

  const setRole = async (p: Profile, r: Role) => {
    const roles: Role[] = r === 'admin' ? ['admin'] : r === 'performer' ? ['performer'] : ['member'];
    await updateUserRoles(p.uid, roles);
  };

  const setCanSeeEvents = async (p: Profile, v: boolean) => {
    try {
      setBusy((b) => ({ ...b, [p.uid]: true }));
      const ref = doc(db, 'users', p.uid);
      await setDoc(ref, { canSeeEvents: v }, { merge: true });
    } finally {
      setBusy((b) => ({ ...b, [p.uid]: false }));
    }
  };

  const openDrawer = (p: Profile) => {
    setSelected(p);
    setDrawerOpen(true);
  };

  return (
    <section className="ucla-content" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1 className="ucla-heading-xl">Manage Members</h1>
      <p>Search, assign roles, control event access, and finalize RSVPs.</p>

      <div style={{ margin: '12px 0' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, instrument…"
          style={{ width: '100%', maxWidth: 420 }}
        />
      </div>

      {loading && <p>Loading members…</p>}
      {error && <p style={{ color: 'salmon' }}>{String(error)}</p>}

      {!loading && !error && (
        <table className="members-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Instruments</th>
              <th>Role</th>
              <th>Change Role</th>
              <th>See Events?</th>
              <th>RSVPs</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: Profile) => {
              const roles = coerceRoles(p.roles as any);
              const current = primaryRole(roles);
              const canSeeEvents = Boolean((p as any).canSeeEvents);
              const isBusy = !!busy[p.uid];

              return (
                <tr key={p.uid}>
                  <td>{p.name ?? ''}</td>
                  <td>{p.email ?? ''}</td>
                  <td>{(p.instruments ?? []).join(', ')}</td>
                  <td><RoleBadge role={current} /></td>
                  <td>
                    <RoleSelect value={current} onChange={(r) => setRole(p, r)} />
                  </td>
                  <td>
                    <div className="perm-cell">
                      <Toggle
                        checked={canSeeEvents}
                        disabled={isBusy}
                        onChange={(v) => setCanSeeEvents(p, v)}
                        label="Can view members events"
                      />
                      <span className="perm-label">{canSeeEvents ? 'Allowed' : 'Hidden'}</span>
                    </div>
                  </td>
                  <td>
                    <button className="btn" onClick={() => openDrawer(p)}>Open</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <MemberRsvpDrawer
        member={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </section>
  );
};

export default AdminManageMembers;
