// FILE: src/pages/Members/Settings.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import './Settings.css';

// --- Types for optional .ics export ---
type FBTimestamp =
  | Timestamp
  | { toDate: () => Date }
  | Date
  | string
  | number
  | null
  | undefined;

interface EventDoc {
  id: string;
  title: string;
  start: FBTimestamp;
  end: FBTimestamp;
  location?: string;
  description?: string;
  status?: string;
}

// --- Helpers for .ics export ---
const toDate = (v: FBTimestamp): Date | null => {
  if (!v && v !== 0) return null;
  // @ts-expect-error: runtime narrow for Timestamp-like
  if (typeof v === 'object' && v && typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toICSDateUTC = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
  `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const icsEscape = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/[,;]/g, (m) => `\\${m}`);

const buildICS = (
  events: (Required<Pick<EventDoc, 'id' | 'title'>> & {
    start: Date;
    end: Date;
    location?: string;
    description?: string;
  })[]
) => {
  const out: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Uclatlán//Mariachi Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mariachi de Uclatlán — Events',
  ];
  for (const ev of events) {
    out.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@uclatlanmariachi`,
      `DTSTAMP:${toICSDateUTC(new Date())}`,
      `DTSTART:${toICSDateUTC(ev.start)}`,
      `DTEND:${toICSDateUTC(ev.end)}`,
      `SUMMARY:${icsEscape(ev.title)}`,
      ev.location ? `LOCATION:${icsEscape(ev.location)}` : '',
      ev.description ? `DESCRIPTION:${icsEscape(ev.description)}` : '',
      'END:VEVENT'
    );
  }
  out.push('END:VCALENDAR');
  return out.filter(Boolean).join('\r\n');
};

const MembersSettings: React.FC = () => {
  const navigate = useNavigate();

  // --- Logout ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('adminAccess');
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // --- Calendar export (.ics) ---
  const [loadingICS, setLoadingICS] = React.useState(false);
  const [icsMsg, setIcsMsg] = React.useState('');

  const handleDownloadICS = React.useCallback(async () => {
    setLoadingICS(true);
    setIcsMsg('');
    try {
      const q = query(
        collection(db, 'events'),
        where('status', 'in', ['published', 'confirmed', 'active']),
        orderBy('start', 'asc')
      );
      const snap = await getDocs(q);
      const rows: (Required<Pick<EventDoc, 'id' | 'title'>> & {
        start: Date;
        end: Date;
        location?: string;
        description?: string;
      })[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as EventDoc;
        const start = toDate(d.start);
        const end = toDate(d.end);
        if (!start || !end) return;
        rows.push({
          id: doc.id,
          title: d.title ?? 'Untitled Event',
          start,
          end,
          location: d.location ?? '',
          description: d.description ?? '',
        });
      });

      const ics = buildICS(rows);
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'uclatlan_events.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setIcsMsg(`Exported ${rows.length} event${rows.length === 1 ? '' : 's'} to .ics`);
    } catch (e: any) {
      console.error('[Settings] Download ICS failed', e);
      setIcsMsg('Failed to export calendar');
    } finally {
      setLoadingICS(false);
    }
  }, []);

  // --- Change password ---
  const [currentPwd, setCurrentPwd] = React.useState('');
  const [newPwd, setNewPwd] = React.useState('');
  const [confirmPwd, setConfirmPwd] = React.useState('');
  const [pwdMsg, setPwdMsg] = React.useState('');
  const [busyPwd, setBusyPwd] = React.useState(false);

  const canSubmitPwd =
    currentPwd.length > 0 && newPwd.length >= 8 && newPwd === confirmPwd;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');
    const user = auth.currentUser;
    if (!user) {
      setPwdMsg('You must be logged in.');
      return;
    }
    if (!canSubmitPwd) {
      setPwdMsg(
        'Please fill all fields. Password must be at least 8 characters and match.'
      );
      return;
    }
    try {
      setBusyPwd(true);
      const email = user.email;
      if (!email) {
        throw new Error(
          'This account uses a provider login (e.g., Google). Change your password with your provider.'
        );
      }
      if (currentPwd === newPwd) {
        throw new Error('New password must be different from the current password.');
      }
      // Reauthenticate
      const cred = EmailAuthProvider.credential(email, currentPwd);
      await reauthenticateWithCredential(user, cred);
      // Update
      await updatePassword(user, newPwd);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdMsg('Password updated successfully.');
    } catch (err: any) {
      setPwdMsg(err?.message ?? 'Failed to change password');
    } finally {
      setBusyPwd(false);
    }
  };

  return (
    <section className="settings ucla-content">
      <h1 className="ucla-heading-xl">Account Settings</h1>
      <p className="ucla-paragraph">
        Manage your session, export your calendar, and update your password.
      </p>

      {/* Calendar export */}
      <div className="settings-card">
        <h2>Calendar</h2>
        <p className="muted">
          Export all published/confirmed events to an .ics file for Google/Apple/Outlook.
        </p>
        <button
          className="btn primary"
          onClick={handleDownloadICS}
          disabled={loadingICS}
        >
          {loadingICS ? 'Building calendar…' : 'Download .ics of events'}
        </button>
        {icsMsg && <p className="status">{icsMsg}</p>}
      </div>

      {/* Change password */}
      <div className="settings-card">
        <h2>Change Password</h2>
        <form className="form" onSubmit={handleChangePassword}>
          <label>
            <span>Current password</span>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            <span>New password</span>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="btn primary" type="submit" disabled={!canSubmitPwd || busyPwd}>
            {busyPwd ? 'Updating…' : 'Update password'}
          </button>
          {pwdMsg && (
            <p
              className={`status ${
                /failed|error|requires|different/i.test(pwdMsg) ? 'error' : ''
              }`}
            >
              {pwdMsg}
            </p>
          )}
          <p className="muted tiny">
            Note: If you signed in with Google/SSO, change your password with your provider.
          </p>
        </form>
      </div>

      {/* Session */}
      <div className="settings-card danger">
        <h2>Session</h2>
        <p className="muted">Sign out of your account on this device.</p>
        <button className="btn danger" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </section>
  );
};

export default MembersSettings;
