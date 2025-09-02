// =============================================
// FILE: src/pages/Members/Profile.tsx
// Description: Member profile page using services/profile.ts + Storage avatar upload
// =============================================
import React, { useEffect, useState } from 'react';
import './Profile.css';
import { auth, storage } from '../../firebase';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UserProfile } from '../../services/profile';
import { getProfile, upsertProfile } from '../../services/profile';

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

const Profile: React.FC = () => {
  const user = auth.currentUser; // Member route should ensure auth, but this can be briefly null at first render
  const uid = user?.uid ?? '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [p, setP] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // ---------- Load profile ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!uid) { setLoading(false); return; } // guard if auth not ready yet
      setLoading(true);
      try {
        const found = await getProfile(uid);
        const seed = found ?? emptyProfile(uid, user?.email ?? null);
        if (mounted) setP(seed);
        if (!found) await upsertProfile(uid, seed); // seed doc on first visit
      } catch (e: any) {
        console.error('[Profile load]', e);
        setError(e?.message ?? 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [uid, user?.email]);

  // ---------- Handlers ----------
  const onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (e) => {
    const { name, value } = e.target as HTMLInputElement;
    setP((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const onPickAvatar: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const uploadAvatarIfNeeded = async (): Promise<string | undefined> => {
    if (!avatarFile || !uid) return undefined;
    const ext = avatarFile.name.split('.').pop() || 'jpg';
    // per-user folder so Storage rules can enforce ownership
    const objectRef = ref(storage, `avatars/${uid}/avatar.${ext}`);
    await uploadBytes(objectRef, avatarFile);
    const url = await getDownloadURL(objectRef);
    return url;
  };

  const onSave = async () => {
    if (!p || !uid) return;
    setSaving(true);
    setError('');
    try {
      // 1) Avatar
      const avatarURL = await uploadAvatarIfNeeded();

      // 2) Normalize instruments (comma-separated input to array)
      const csv = (p as any)._instrumentsCSV as string | undefined;
      const instruments = csv ? csv.split(',').map((s) => s.trim()).filter(Boolean) : (p.instruments || []);

      // 3) Build payload
      const payload: Partial<UserProfile> = {
        ...p,
        instruments,
        ...(avatarURL ? { photoURL: avatarURL } : {}),
      };

      // 4) Upsert
      await upsertProfile(uid, payload);

      // 5) Sync Auth profile
      await updateAuthProfile(user!, {
        displayName: p.name || user?.displayName || undefined,
        photoURL: avatarURL ?? p.photoURL ?? undefined,
      });

      setEditMode(false);
      setP({ ...p, instruments, ...(avatarURL ? { photoURL: avatarURL } : {}) });
    } catch (e: any) {
      console.error('[Profile save]', e);
      setError(e?.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profile-wrap"><div className="card"><p>Loading profile…</p></div></div>;
  if (!p) return <div className="profile-wrap"><div className="card"><p>No profile.</p></div></div>;

  const roles = p.roles || [];

  return (
    <div className="profile-wrap">
      <div className="card profile-card">
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
    </div>
  );
};

export default Profile;
