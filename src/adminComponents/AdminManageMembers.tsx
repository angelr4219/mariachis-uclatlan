// =============================================================
// FILE: src/adminComponents/AdminManageMembers.tsx
// Purpose: Manage roles + per-user permission + ADMIN RSVP FINALIZATION
// Stability: Adds strong guards to prevent crashes even when data/rules are messy
//  - Safe loaders (events/inquiries fetched independently — one failing won't crash the drawer)
//  - Member/UID assertions + early returns
//  - Fallback when no events have status=="published"
//  - Defensive rendering (null-safe everywhere)
//  - Clear errors to the UI (loadError) and console diagnostics
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

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled, label }) => (
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

// ---------- Local helpers ----------
export type CalendarItem = {
  id: string;
  source: 'events' | 'inquiries';
  title: string;
  start?: Date | Timestamp | string | null;
  end?: Date | Timestamp | string | null;
  status?: 'draft' | 'published' | 'cancelled' | string;
  location?: string | null;
};

type RSVP = 'yes' | 'maybe' | 'no' | '';

type AvailabilityDocData = {
  uid?: string;
  status?: RSVP;
  finalized?: boolean;
  updatedAt?: Timestamp;
  respondedAt?: Timestamp; // optional legacy
};

const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  try { const d = new Date(v); return isNaN(d.getTime()) ? undefined : d; } catch { return undefined; }
};

const toTs = (v: any): Timestamp | null => { const d = toDate(v); return d ? Timestamp.fromDate(d) : null; };

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

const fmtWhen = (ts?: Timestamp): string => (ts ? (ts.toDate().toLocaleString?.() || ts.toDate().toISOString()) : '');

const keyOf = (src: 'events' | 'inquiries', id: string) => `${src}/${id}`;

// Hardened path builder (prevents 'events/availability/<uid>' mistakes)
const assert: (cond: any, msg: string) => asserts cond = (cond, msg) => { if (!cond) throw new Error(msg); };
const availabilityDocRef = (source: 'events' | 'inquiries', id: string, uid: string) => {
  assert(source === 'events' || source === 'inquiries', `[AdminManageMembers] bad source: ${source}`);
  assert(id && typeof id === 'string', '[AdminManageMembers] missing id');
  assert(uid && typeof uid === 'string', '[AdminManageMembers] missing uid');
  if (id === 'availability' || id.includes('/')) {
    console.error('[AdminManageMembers] Suspicious id used to build availability path', { source, id, uid });
  }
  return doc(db, source, id, 'availability', uid);
};

// ---------- Member RSVP Drawer ----------
const MemberRsvpDrawer: React.FC<{
  member: Profile | null;
  open: boolean;
  onClose: () => void;
}> = ({ member, open, onClose }) => {
  const [items, setItems] = React.useState<CalendarItem[]>([]);
  const [rsvps, setRsvps] = React.useState<Record<string, RSVP>>({}); // key: source/id
  const [finalized, setFinalized] = React.useState<Record<string, boolean>>({});
  const [updatedAt, setUpdatedAt] = React.useState<Record<string, Timestamp | undefined>>({});
  const [busy, setBusy] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        if (!open) return; // drawer closed — nothing to do
        if (!member || !member.uid) { setItems([]); return; }
        setLoading(true);
        setLoadError(null);

        // ---- fetch events (published first, then fallback to all) ----
        const evCol = collection(db, 'events') as CollectionReference;
        let evDocs = [] as any[];
        try {
          const tryPublishedSnap = await getDocs(query(evCol, where('status', '==', 'published')));
          evDocs = tryPublishedSnap.docs;
          if (!evDocs.length) {
            const allSnap = await getDocs(evCol);
            evDocs = allSnap.docs;
            console.warn('[AdminManageMembers] No events with status=="published". Falling back to ALL events.');
          }
        } catch (err) {
          console.error('[AdminManageMembers] events fetch failed:', err);
          evDocs = []; // keep going — inquiries may still load
        }
        const evItems: CalendarItem[] = evDocs.map((d: any) => {
          const data = (typeof (d as any).data === 'function' ? (d as any).data() : (d as any).data) || {};
          return {
            ...(data || {}),
            id: String(d.id),
            source: 'inquiries',
            title: data.title || data.name || 'Untitled',
            start: (data.start ?? data.date) ?? null,
            end: data.end ?? null,
            location: data.location ?? null,
            status: data.status || 'inquiry',
          } as CalendarItem;
        });

        // ---- filter malformed ids & compute upcoming ----
        const allRaw = [...evItems, ...items];
        const filtered = allRaw.filter((it) => {
          const ok = Boolean(it && typeof it.id === 'string' && it.id.trim());
          if (!ok) console.error('[AdminManageMembers] Dropping item with missing id', it);
          return ok;
        });

        // helpful console table for debugging
        try { console.table(filtered.map((it) => ({ source: it.source, id: it.id, title: it.title })));
        } catch { /* console.table may not exist in some envs */ }

        const now = Date.now();
        const combined = filtered
          .filter((it) => {
            const s = toDate(it.start)?.getTime();
            return typeof s === 'number' ? s >= now - 1000 * 60 * 60 * 24 : true;
          })
          .sort((a, b) => (toDate(a.start)?.getTime() ?? 0) - (toDate(b.start)?.getTime() ?? 0));

        // ---- seed local state ----
        const seedRSVP: Record<string, RSVP> = {};
        const seedFinal: Record<string, boolean> = {};
        const seedUpd: Record<string, Timestamp | undefined> = {};
        for (const it of combined) {
          const k = keyOf(it.source, it.id);
          seedRSVP[k] = '';
          seedFinal[k] = false;
          seedUpd[k] = undefined;
        }

        // ---- fetch user's rsvp docs (best-effort per item) ----
        const docs = await Promise.all(
          combined.map(async (it) => {
            try { return await getDoc(availabilityDocRef(it.source, it.id, member.uid)); }
            catch (err) { console.error('[AdminManageMembers] availability get failed:', it, err); return null as any; }
          })
        );

        const nextRSVP = { ...seedRSVP };
        const nextFinal = { ...seedFinal };
        const nextUpd = { ...seedUpd };
        docs.forEach((d, i) => {
          if (!d || !d.exists?.()) return;
          const data = d.data() as AvailabilityDocData;
          const it = combined[i];
          if (!it) return;
          const k = keyOf(it.source, it.id);
          nextRSVP[k] = (data.status as RSVP) || '';
          nextFinal[k] = Boolean(data.finalized);
          nextUpd[k] = data.updatedAt || data.respondedAt;
        });

        if (!alive) return;
        setItems(combined);
        setRsvps(nextRSVP);
        setFinalized(nextFinal);
        setUpdatedAt(nextUpd);
      } catch (e: any) {
        console.error('[AdminManageMembers] load crashed:', e);
        if (alive) setLoadError(e?.message || 'Failed to load items');
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    return () => { alive = false; };
  }, [open, member]);

  const onChange = (src: 'events' | 'inquiries', id: string, value: RSVP) => {
    const k = keyOf(src, id);
    setRsvps((m) => ({ ...m, [k]: value }));
  };

  const onToggleFinal = (src: 'events' | 'inquiries', id: string, v: boolean) => {
    const k = keyOf(src, id);
    setFinalized((m) => ({ ...m, [k]: v }));
  };

  const saveOne = async (it: CalendarItem) => {
    if (!member || !member.uid) return;
    const k = keyOf(it.source, it.id);
    const status = (rsvps[k] || '') as RSVP;
    if (!status) return;
    setBusy((b) => ({ ...b, [k]: true }));
    try {
      const finalizedFlag = Boolean(finalized[k]);
      const payload = {
        uid: member.uid,
        displayName: member.name || member.email || 'Unknown',
        email: member.email || null,
        status, // 'yes' | 'maybe' | 'no'
        updatedAt: Timestamp.now(),
        source: it.source, // helps reporting
        refId: it.id,
        eventId: it.id, // legacy field name for compatibility
        eventTitle: it.title || 'Untitled',
        eventStart: toTs(it.start),
        eventEnd: toTs(it.end),
        eventLocation: (it as any).location || null,
        finalized: finalizedFlag,
        finalizedBy: finalizedFlag ? 'admin' : null,
        finalizedAt: finalizedFlag ? Timestamp.now() : null,
      } as const;

      // Subcollection doc at the source (HARDENED PATH)
      const subRef = availabilityDocRef(it.source, it.id, member.uid);
      await setDoc(subRef, payload, { merge: true });

      // Flat mirror with source in id to avoid collisions
      const flatId = `${it.source}_${it.id}_${member.uid}`;
      const flatRef = doc(db, 'availability', flatId);
      await setDoc(flatRef, payload, { merge: true });

      setUpdatedAt((m) => ({ ...m, [k]: payload.updatedAt }));
    } catch (err) {
      console.error('[AdminManageMembers] saveOne failed:', err);
    } finally {
      setBusy((b) => ({ ...b, [k]: false }));
    }
  };

  const saveAll = async () => {
    for (const it of items) {
      const k = keyOf(it.source, it.id);
      if (rsvps[k]) {
        // eslint-disable-next-line no-await-in-loop
        await saveOne(it);
      }
    }
  };

  return (
    <div className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="Manage Member RSVPs">
        <div className="drawer-head">
          <div className="drawer-title">
            <div className="avatar sm">
              {member?.photoURL ? (
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
          <div className="drawer-actions">
            <button className="btn-light" onClick={onClose}>Close</button>
            <button className="btn" onClick={saveAll} disabled={loading}>Save All</button>
          </div>
        </div>

        <div className="drawer-body">
          {loading && <p className="muted">Loading events & inquiries…</p>}
          {loadError && <p className="error-text">{loadError}</p>}
          {!loading && !items.length && !loadError && <p className="muted">No upcoming items.</p>}

          <div className="event-list">
            {items.map((it) => {
              const k = keyOf(it.source, it.id);
              const hasResponse = Boolean(rsvps[k]);
              const isFinal = Boolean(finalized[k]);
              const updated = updatedAt[k];

              return (
                <article className="event-card" key={k}>
                  <header className="event-head">
                    <div>
                      <h4>{it.title || 'Untitled'}</h4>
                      <div className="meta-line">
                        <span className={`status-pill ${it.status}`}>{it.status || it.source}</span>
                        <span className="chip">{it.source === 'events' ? 'Event' : 'Inquiry'}</span>
                        {hasResponse ? (
                          <span className="chip chip--ok" title={`Last update: ${fmtWhen(updated)}`}>
                            Responded{updated ? ` • ${fmtWhen(updated)}` : ''}
                          </span>
                        ) : (
                          <span className="chip">No response</span>
                        )}
                        {isFinal && <span className="chip chip--final">Finalized</span>}
                      </div>
                    </div>
                  </header>

                  <dl className="event-meta">
                    <div className="meta-row"><dt>When</dt><dd>{fmtRange(it.start, it.end) || 'TBA'}</dd></div>
                    {(it as any).location && (
                      <div className="meta-row"><dt>Where</dt><dd>{(it as any).location}</dd></div>
                    )}
                  </dl>

                  <div className="event-actions">
                    <label className="sr-only" htmlFor={`sel-${member?.uid}-${k}`}>RSVP for {it.title}</label>
                    <select
                      id={`sel-${member?.uid}-${k}`}
                      value={rsvps[k] || ''}
                      onChange={(e) => onChange(it.source, it.id, e.target.value as RSVP)}
                      disabled={!!busy[k]}
                    >
                      <option value="">Select…</option>
                      <option value="yes">Yes</option>
                      <option value="maybe">Maybe</option>
                      <option value="no">No</option>
                    </select>

                    <label className="finalize-toggle">
                      <input
                        type="checkbox"
                        checked={!!finalized[k]}
                        onChange={(e) => onToggleFinal(it.source, it.id, e.target.checked)}
                        disabled={!!busy[k]}
                      />
                      <span>Finalize</span>
                    </label>

                    <button
                      className="btn-primary"
                      disabled={!!busy[k] || !(rsvps[k] || '')}
                      onClick={() => saveOne(it)}
                    >
                      {busy[k] ? 'Saving…' : 'Save'}
                    </button>
                  </div>

                  {finalized[k] && (
                    <p className="finalized-note">This RSVP will be <strong>locked for the performer</strong>.</p>
                  )}
                </article>
              );
            })}
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
      const name = (p?.name ?? '').toLowerCase();
      const email = (p?.email ?? '').toLowerCase();
      const instruments = ((p as any)?.instruments ?? []).join(', ').toLowerCase();
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
    setSelected(p || null);
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
              const roles = coerceRoles((p as any)?.roles as any);
              const current = primaryRole(roles);
              const canSeeEvents = Boolean((p as any)?.canSeeEvents);
              const isBusy = !!busy[p.uid];

              return (
                <tr key={p.uid}>
                  <td>{p?.name ?? ''}</td>
                  <td>{p?.email ?? ''}</td>
                  <td>{((p as any)?.instruments ?? []).join(', ')}</td>
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
                    <button className="btn" onClick={() => openDrawer(p)} disabled={!p?.uid}>Manage</button>
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
