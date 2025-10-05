// =============================================
// FILE: src/pages/Members/Profile.tsx
// Description: Member profile page using services/profile.ts + Storage avatar upload
//              PLUS a list of events this member agreed to (status == "yes"),
//              matched by their email in the flat `availability` collection.
// - Keeps your existing services/profile.ts contract (getProfile / upsertProfile)
// - Uses Firebase Storage for avatar, then persists photoURL to users profile
// - Clean card layout + responsive grid + inline banners (no alerts)
// =============================================
import React, { useEffect, useMemo, useState } from 'react';
import './Profile.css';
import { auth, storage, db } from '../../firebase';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UserProfile } from '../../services/profile';
import { getProfile, upsertProfile } from '../../services/profile';
import {
  collection,
  getDocs,
  query,
  where,
  type CollectionReference,
  Timestamp,
} from 'firebase/firestore';

// ---------- Helpers ----------
const emptyProfile = (uid: string, email: string | null): UserProfile => ({
  uid,
  name: '',
  email: email || '',
  phoneNumber: '',
  year: '',
  major: '',
  instrument: '',
  instruments: [],
  section: '',
  bio: '',
  roles: ['performer'],
  returning: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  photoURL: '',
});

const toDate = (v: any): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
};

const fmtRange = (start: any, end: any): string => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s) return 'TBA';
  const sStr = s.toLocaleString?.() || s.toISOString();
  if (!e) return sStr;
  const same = s.toDateString() === e.toDateString();
  const eStr = same ? e.toLocaleTimeString?.() : e.toLocaleString?.();
  return `${sStr} → ${eStr}`;
};

// ---------- Types ----------
interface AcceptedRow {
  id: string;          // availability doc id (eventId_uid or similar)
  eventId: string;
  eventTitle: string;
  eventStart: Date | null;
  eventEnd: Date | null;
  eventLocation?: string | null;
}

// =============================================
// Component
// =============================================
const Profile: React.FC = () => {
  const user = auth.currentUser; // route should protect this; may be null at first paint
  const uid = user?.uid ?? '';
  const email = user?.email ?? '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [p, setP] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [banner, setBanner] = useState<null | { type: 'success' | 'error'; text: string }>(null);

  // Events the member said "yes" to (matched by email, as requested)
  const [accepted, setAccepted] = useState<AcceptedRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // ---------- Load profile ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!uid) { setLoading(false); return; }
      setLoading(true);
      try {
        const found = await getProfile(uid);
        const seed = found ?? emptyProfile(uid, user?.email ?? null);
        if (alive) setP(seed);
        if (!found) await upsertProfile(uid, seed); // seed on first visit
      } catch (e: any) {
        console.error('[Profile load]', e);
        if (alive) setError(e?.message ?? 'Failed to load profile');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [uid, user?.email]);

  // ---------- Load accepted events (status=="yes" by email) ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!email) { setLoadingEvents(false); return; }
      setLoadingEvents(true);
      try {
        const col = collection(db, 'availability') as CollectionReference;
        const qRef = query(col, where('email', '==', email), where('status', '==', 'yes'));
        const snap = await getDocs(qRef);
        if (!alive) return;
        const rows: AcceptedRow[] = snap.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            eventId: data.eventId,
            eventTitle: data.eventTitle || 'Untitled Event',
            eventStart: toDate(data.eventStart),
            eventEnd: toDate(data.eventEnd),
            eventLocation: data.eventLocation ?? null,
          };
        });
        rows.sort((a, b) => (a.eventStart?.getTime() ?? 0) - (b.eventStart?.getTime() ?? 0));
        if (alive) setAccepted(rows);
      } catch (e) {
        console.error('[Accepted events]', e);
      } finally {
        if (alive) setLoadingEvents(false);
      }
    })();
    return () => { alive = false; };
  }, [email]);

  // ---------- Handlers ----------
  const onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (e) => {
    const { name, value } = e.target as HTMLInputElement;
    setP((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const onPickAvatar: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      // Show a quick preview
      const next = URL.createObjectURL(file);
      setP((prev) => (prev ? { ...prev, photoURL: next } : prev));
    }
  };

  const uploadAvatarIfNeeded = async (): Promise<string | undefined> => {
    if (!avatarFile || !uid) return undefined;
    const ext = (avatarFile.name.split('.').pop() || 'jpg').toLowerCase();
    const objectRef = ref(storage, `avatars/${uid}/avatar.${ext}`);
    await uploadBytes(objectRef, avatarFile);
    const url = await getDownloadURL(objectRef);
    return url;
  };

  const onSave = async () => {
    if (!p || !uid) return;
    setSaving(true);
    setError('');
    setBanner(null);
    try {
      // 1) Avatar upload
      const avatarURL = await uploadAvatarIfNeeded();

      // 2) Normalize instruments (comma CSV → array)
      const csv = (p as any)._instrumentsCSV as string | undefined;
      const instruments = csv ? csv.split(',').map((s) => s.trim()).filter(Boolean) : (p.instruments || []);

      // 3) Build payload
      const payload: Partial<UserProfile> = {
        ...p,
        instruments,
        ...(avatarURL ? { photoURL: avatarURL } : {}),
      };

      // 4) Upsert profile doc
      await upsertProfile(uid, payload);

      // 5) Sync Auth display/photo
      const displayName = p.name || user?.displayName || undefined;
      await updateAuthProfile(auth.currentUser!, {
        displayName,
        photoURL: avatarURL ?? p.photoURL ?? undefined,
      });

      setEditMode(false);
      setP({ ...p, instruments, ...(avatarURL ? { photoURL: avatarURL } : {}) });
      setBanner({ type: 'success', text: 'Profile saved. Thank you!' });
    } catch (e: any) {
      console.error('[Profile save]', e);
      setError(e?.message ?? 'Failed to save profile');
      setBanner({ type: 'error', text: 'Something went wrong. Try again or re‑login.' });
    } finally {
      setSaving(false);
    }
  };

  // ---------- Render ----------
  if (loading) return <div className="profile-wrap"><div className="card"><p>Loading profile…</p></div></div>;
  if (!p) return <div className="profile-wrap"><div className="card"><p>No profile.</p></div></div>;

  const roles = p.roles || [];

  return (
    <div className="profile-wrap">
      <div className="card profile-card">
        {banner && (
          <div className={`inline-banner ${banner.type}`} role="status" aria-live="polite">
            <span className="banner-icon" aria-hidden>{banner.type === 'success' ? '✓' : '!'}</span>
            <span>{banner.text}</span>
            <button className="banner-dismiss" onClick={() => setBanner(null)} aria-label="Dismiss">×</button>
          </div>
        )}

        <div className="profile-head">
          <div className="avatar">
            {p.photoURL ? (
              <img src={p.photoURL} alt={`${p.name || 'Member'} avatar`} />
            ) : (
              <div className="avatar-placeholder">{(p.name || p.email || 'U')[0].toUpperCase()}</div>
            )}
            {editMode && (
              <label className="btn btn-light" style={{ marginTop: 8 }}>
                Upload photo
                <input type="file" accept="image/*" onChange={onPickAvatar} hidden />
              </label>
            )}
          </div>

          <div className="id-block">
            {!editMode ? (
              <>
                <h2>{p.name || 'Add your name'}</h2>
                <p className="muted">{p.email}</p>
                {!!roles.length && (
                  <div className="roles">
                    {roles.map((r) => (
                      <span key={r} className={`role-chip role-${r}`}>{r}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <label className="lbl">Full Name</label>
                <input name="name" value={p.name || ''} onChange={onChange} placeholder="First Last" />
              </>
            )}
          </div>

          <div className="actions">
            {!editMode ? (
              <button className="btn" onClick={() => setEditMode(true)}>Edit</button>
            ) : (
              <>
                <button className="btn" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</button>
                <button className="btn btn-light" disabled={saving} onClick={() => setEditMode(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>

        <div className="grid">
          <div className="col">
            <label className="lbl">Phone</label>
            {!editMode ? (
              <div className="val">{p.phoneNumber || '—'}</div>
            ) : (
              <input name="phoneNumber" value={p.phoneNumber || ''} onChange={onChange} placeholder="+1 (###) ###-####" />
            )}
          </div>
          <div className="col">
            <label className="lbl">Year</label>
            {!editMode ? (
              <div className="val">{p.year || '—'}</div>
            ) : (
              <select name="year" value={p.year || ''} onChange={onChange}>
                <option value="">Select</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
                <option>Graduate</option>
                <option>Alumni</option>
              </select>
            )}
          </div>
          <div className="col">
            <label className="lbl">Major</label>
            {!editMode ? (
              <div className="val">{p.major || '—'}</div>
            ) : (
              <input name="major" value={p.major || ''} onChange={onChange} placeholder="e.g., Math, EE, Music" />
            )}
          </div>
          <div className="col">
            <label className="lbl">Instrument</label>
            {!editMode ? (
              <div className="val">{p.instrument || '—'}</div>
            ) : (
              <input name="instrument" value={p.instrument || ''} onChange={onChange} placeholder="e.g., Violin, Trumpet, Vihuela" />
            )}
          </div>
          <div className="col">
            <label className="lbl">Section</label>
            {!editMode ? (
              <div className="val">{p.section || '—'}</div>
            ) : (
              <input name="section" value={p.section || ''} onChange={onChange} placeholder="Strings / Brass / Rhythm / Vocals" />
            )}
          </div>
          <div className="col">
            <label className="lbl">All Instruments</label>
            {!editMode ? (
              <div className="val">{(p.instruments && p.instruments.length) ? p.instruments.join(', ') : '—'}</div>
            ) : (
              <input name="_instrumentsCSV" value={(p.instruments || []).join(', ')} onChange={onChange} placeholder="Violin, Viola, Trumpet" />
            )}
          </div>
        </div>

        <div className="grid">
          <div className="col">
            <label className="lbl">Emergency Contact</label>
            {!editMode ? (
              <div className="val">{p.emergencyName || '—'}</div>
            ) : (
              <input name="emergencyName" value={p.emergencyName || ''} onChange={onChange} placeholder="Full name" />
            )}
          </div>
          <div className="col">
            <label className="lbl">Emergency Phone</label>
            {!editMode ? (
              <div className="val">{p.emergencyPhone || '—'}</div>
            ) : (
              <input name="emergencyPhone" value={p.emergencyPhone || ''} onChange={onChange} placeholder="+1 (###) ###-####" />
            )}
          </div>
          <div className="col">
            <label className="lbl">Relation</label>
            {!editMode ? (
              <div className="val">{p.emergencyRelation || '—'}</div>
            ) : (
              <input name="emergencyRelation" value={p.emergencyRelation || ''} onChange={onChange} placeholder="Parent / Sibling / Friend" />
            )}
          </div>
        </div>

        <div className="bio">
          <label className="lbl">Bio</label>
          {!editMode ? (
            <p className="val multi">{p.bio || 'Add a short bio about you, your experience, and favorite pieces to perform.'}</p>
          ) : (
            <textarea name="bio" value={p.bio || ''} onChange={onChange} rows={4} placeholder="Short bio (markdown/plaintext)"></textarea>
          )}
        </div>

        {error && <p className="error">{error}</p>}
      </div>

      {/* Accepted events section */}
      <h2 className="section-title">Events I’m Playing (Yes)</h2>
      {loadingEvents && <p className="muted">Loading your events…</p>}
      <div className="accepted-list">
        {accepted.map((ev) => (
          <article className="accepted-card" key={ev.id}>
            <header className="accepted-head">
              <h3 className="accepted-title">{ev.eventTitle}</h3>
            </header>
            <dl className="accepted-meta">
              <div className="meta-row"><dt>When</dt><dd>{fmtRange(ev.eventStart, ev.eventEnd)}</dd></div>
              {ev.eventLocation && (
                <div className="meta-row"><dt>Where</dt><dd>{ev.eventLocation}</dd></div>
              )}
            </dl>
          </article>
        ))}
        {!loadingEvents && !accepted.length && (
          <p className="muted">No accepted events yet. Head to Performer Availability to RSVP.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;

