// src/pages/MembersProfile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import './MembersProfile.css';

// ---------- utils ----------
const csvToArray = (csv: string): string[] =>
  Array.from(new Set(csv.split(',').map(s => s.trim()).filter(Boolean)));

const arrayToCsv = (arr?: string[]): string => (arr && arr.length ? arr.join(', ') : '');

// ---------- types ----------
interface ProfileDoc {
  name?: string;
  email?: string;
  phoneNumber?: string;
  year?: string; // "1st Year" | "2nd Year" | "3rd Year" | "4th Year" | "Graduate"
  major?: string;
  instruments?: string[];
  sections?: string[];
  returning?: 'Yes' | 'No' | string;
  pronouns?: string | null;
  bio?: string | null;
  emergencyContact?: { name?: string; phone?: string; relation?: string } | null;
  role?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
}

const MembersProfile: React.FC = () => {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    year: '',
    major: '',
    instrumentsCsv: '',
    sectionCsv: '',
    returning: 'No',
    pronouns: '',
    bio: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  // Keep a memo of valid year options to keep options consistent across app
  const yearOptions = useMemo(() => [
    '1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'
  ], []);

  // ---------- auth + initial fetch ----------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUid(null);
        setLoading(false);
        return;
      }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = (snap.exists() ? (snap.data() as ProfileDoc) : {}) as ProfileDoc;

        setForm({
          name: data.name ?? user.displayName ?? '',
          email: data.email ?? user.email ?? '',
          phoneNumber: data.phoneNumber ?? user.phoneNumber ?? '',
          year: data.year ?? '',
          major: data.major ?? '',
          instrumentsCsv: arrayToCsv(data.instruments),
          sectionCsv: arrayToCsv(data.sections),
          returning: (data.returning as any) ?? 'No',
          pronouns: data.pronouns ?? '',
          bio: data.bio ?? '',
          emergencyName: data.emergencyContact?.name ?? '',
          emergencyPhone: data.emergencyContact?.phone ?? '',
          emergencyRelation: data.emergencyContact?.relation ?? '',
        });
      } catch (err: any) {
        console.error('[MembersProfile] fetch error', err);
        setError(err?.message ?? 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!uid) { setError('You must be signed in to save your profile.'); return; }
    setSaving(true);
    setError(null);
    setOk(null);

    try {
      const payload: ProfileDoc = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        year: form.year,
        major: form.major.trim(),
        instruments: csvToArray(form.instrumentsCsv),
        sections: csvToArray(form.sectionCsv),
        returning: (form.returning as 'Yes' | 'No') ?? 'No',
        pronouns: form.pronouns.trim() || null,
        bio: form.bio.trim() || null,
        emergencyContact: (form.emergencyName || form.emergencyPhone || form.emergencyRelation)
          ? {
              name: form.emergencyName.trim(),
              phone: form.emergencyPhone.trim(),
              relation: form.emergencyRelation.trim(),
            }
          : null,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', uid), payload, { merge: true });
      setOk('Profile saved!');
    } catch (err: any) {
      console.error('[MembersProfile] save error', err);
      setError(err?.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="profile-container"><p>Loading profile…</p></section>
    );
  }

  return (
    <section className="profile-container">
      <h1 className="profile-title">Your Profile</h1>
      <p className="profile-subtitle">Update your member information. Remember to hit Save.</p>

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Name / Email */}
        <div className="grid-2 gap">
          <div>
            <label className="label">Full Name</label>
            <input className="input" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
        </div>

        {/* Phone */}
        <div className="field">
          <label className="label">Phone</label>
          <input className="input" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
        </div>

        {/* Academic */}
        <div className="grid-2 gap">
          <div>
            <label className="label">Year in School</label>
            <select className="input" name="year" value={form.year} onChange={handleChange}>
              <option value="">Select Year</option>
              {yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <div>
            <label className="label">Major</label>
            <input className="input" name="major" value={form.major} onChange={handleChange} />
          </div>
        </div>

        {/* Instruments / Sections */}
        <div className="grid-2 gap">
          <div>
            <label className="label">Instrument(s) (comma-separated)</label>
            <input className="input" name="instrumentsCsv" value={form.instrumentsCsv} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Section(s) (comma-separated)</label>
            <input className="input" name="sectionCsv" value={form.sectionCsv} onChange={handleChange} />
          </div>
        </div>

        {/* Returning? */}
        <div className="field">
          <label className="label">Returning Member?</label>
          <select className="input" name="returning" value={form.returning} onChange={handleChange}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        {/* Pronouns / Bio */}
        <div className="field">
          <label className="label">Pronouns (optional)</label>
          <input className="input" name="pronouns" value={form.pronouns} onChange={handleChange} />
        </div>
        <div className="field">
          <label className="label">Short Bio</label>
          <textarea className="textarea" name="bio" value={form.bio} onChange={handleChange} rows={3} />
        </div>

        {/* Emergency Contact */}
        <fieldset className="fieldset">
          <legend className="legend">Emergency Contact</legend>
          <div className="grid-3 gap">
            <input className="input" placeholder="Name" name="emergencyName" value={form.emergencyName} onChange={handleChange} />
            <input className="input" placeholder="Phone" name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} />
            <input className="input" placeholder="Relation" name="emergencyRelation" value={form.emergencyRelation} onChange={handleChange} />
          </div>
        </fieldset>

        <button type="submit" disabled={saving} className="submit">
          {saving ? 'Saving…' : 'Save Profile'}
        </button>

        {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
        {ok && <p className="ok" style={{ marginTop: 12 }}>{ok}</p>}
      </form>
    </section>
  );
};

export default MembersProfile;
