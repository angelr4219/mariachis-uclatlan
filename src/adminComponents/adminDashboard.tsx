// =============================================
// FILE: src/components/Admin/AdminDashboard.tsx
// Purpose: Admin dashboard with Firestore-backed stats (permission-safe)
// =============================================
import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminDashboard.css';

import { auth, db } from '../firebase'; // <- fix relative path
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  type CollectionReference,
} from 'firebase/firestore';

// Helpers
const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  try { const d = new Date(v); return isNaN(d.getTime()) ? undefined : d; } catch { return undefined; }
};

const StatCard: React.FC<{label: string; value: number | string; loading?: boolean; error?: string | null}> = ({label, value, loading, error}) => (
  <div className="stat-card" aria-live="polite">
    <div className="stat-value">
      {loading ? '…' : error ? '!' : value}
    </div>
    <div className="stat-label">
      {loading ? 'Loading…' : error ? error : label}
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [authed, setAuthed] = React.useState(false);

  // Stats
  const [loading, setLoading] = React.useState(true);
  const [pageErr, setPageErr] = React.useState<string | null>(null);

  const [upcomingEvents, setUpcomingEvents] = React.useState<number | string>('—');
  const [pendingRequests, setPendingRequests] = React.useState<number | string>('—');
  const [performersConfirmed, setPerformersConfirmed] = React.useState<number | string>('—');

  const [errUpcoming, setErrUpcoming] = React.useState<string | null>(null);
  const [errPending, setErrPending] = React.useState<string | null>(null);
  const [errConfirmed, setErrConfirmed] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setAuthed(!!u));
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (!authed) return;

    const load = async () => {
      setLoading(true);
      setPageErr(null);
      setErrUpcoming(null);
      setErrPending(null);
      setErrConfirmed(null);

      const nowMs = Date.now();
      const oneDayAgo = new Date(nowMs - 24 * 60 * 60 * 1000);

      // --- Upcoming Events (published, start >= now - 2h) ---
      const loadUpcoming = (async () => {
        try {
          const evCol = collection(db, 'events') as CollectionReference;
          const evQ = query(evCol, where('status', '==', 'published'));
          const snap = await getDocs(evQ);
          const count = snap.docs.filter((d) => {
            const s = toDate((d.data() as any).start)?.getTime();
            return typeof s === 'number' ? s >= nowMs - 2 * 60 * 60 * 1000 : false;
          }).length;
          setUpcomingEvents(count);
        } catch (e: any) {
          // Permission denied or other errors
          setUpcomingEvents('—');
          setErrUpcoming(e?.code === 'permission-denied' ? 'No permission' : 'Error');
        }
      })();

      // --- Pending Requests (inquiries) ---
      const loadPending = (async () => {
        try {
          const inqCol = collection(db, 'inquiries') as CollectionReference;
          const inqSnap = await getDocs(inqCol);
          const pending = inqSnap.docs.filter((d) => {
            const x = d.data() as any;
            if (typeof x.pushed === 'boolean') return x.pushed === false;
            return x.status !== 'closed';
          }).length;
          setPendingRequests(pending);
        } catch (e: any) {
          setPendingRequests('—');
          setErrPending(e?.code === 'permission-denied' ? 'No permission' : 'Error');
        }
      })();

      // --- Performers Confirmed (availability_responses) ---
      const loadConfirmed = (async () => {
        try {
          const flatCol = collection(db, 'availability_responses') as CollectionReference;
          const flatQ = query(flatCol, where('status', '==', 'yes')); // date filtered client-side
          const flatSnap = await getDocs(flatQ);
          const confirmed = flatSnap.docs.filter((d) => {
            const x = d.data() as any;
            const es = toDate(x.eventStart);
            return es ? es >= oneDayAgo : false;
          }).length;
          setPerformersConfirmed(confirmed);
        } catch (e: any) {
          setPerformersConfirmed('—');
          setErrConfirmed(e?.code === 'permission-denied' ? 'No permission' : 'Error');
        }
      })();

      try {
        await Promise.all([loadUpcoming, loadPending, loadConfirmed]);
      } catch (e: any) {
        // This only triggers if something outside the per-stat try/catch explodes
        setPageErr(e?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authed]);

  const cards = [
    {
      to: 'events',
      title: 'Events',
      desc: 'Create, publish, and manage upcoming events.',
      icon: (
        <svg viewBox="0 0 24 24" className="icon" aria-hidden>
          <path d="M7 2v2M17 2v2M3 8h18M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm3 5h4m-4 4h8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      to: 'managemembers',
      title: 'Manage Members',
      desc: 'Search members and assign roles.',
      icon: (
        <svg viewBox="0 0 24 24" className="icon" aria-hidden>
          <path d="M12 12a4 4 0 1 0-0.001-8.001A4 4 0 0 0 12 12zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      to: 'reports',
      title: 'Reports',
      desc: 'Export availability & payouts (CSV/PDF).',
      icon: (
        <svg viewBox="0 0 24 24" className="icon" aria-hidden>
          <path d="M7 3h10a2 2 0 0 1 2 2v10l-4 4H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm8 0v4h4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 13h8M8 9h6M8 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      to: 'inquiries',
      title: 'Requests',
      desc: 'Accept/decline Hire Us inquiries → events.',
      icon: (
        <svg viewBox="0 0 24 24" className="icon" aria-hidden>
          <path d="M21 7v10a2 2 0 0 1-2 2H9l-6 3V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      to: 'participation',
      title: 'Participation',
      desc: 'Attendance & financial summaries.',
      icon: (
        <svg viewBox="0 0 24 24" className="icon" aria-hidden>
          <path d="M4 19V5m16 14V5M9 19V9m6 10V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">Manage members, assign roles, and oversee events.</p>
        </div>
      </header>

      <section className="admin-stats" aria-label="Quick Stats">
        <StatCard label="Upcoming Events" value={upcomingEvents} loading={loading} error={errUpcoming} />
        <StatCard label="Pending Requests" value={pendingRequests} loading={loading} error={errPending} />
        <StatCard label="Performers Confirmed" value={performersConfirmed} loading={loading} error={errConfirmed} />
      </section>

      {pageErr && <p className="admin-sub" style={{color:'#b91c1c'}}>{pageErr}</p>}

      <section className="admin-grid" aria-label="Admin Navigation">
        {cards.map((c) => (
          <NavLink key={c.to} className={({ isActive }) => `admin-card ${isActive ? 'active' : ''}`} to={c.to}>
            {c.icon}
            <div className="card-body">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
            <span className="chev" aria-hidden>›</span>
          </NavLink>
        ))}
      </section>
    </div>
  );
};

export default AdminDashboard;
