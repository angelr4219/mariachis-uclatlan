
// =============================================
// FILE: src/components/Admin/AdminDashboard.tsx
// Purpose: Admin dashboard with real Firestore-backed stats
// Notes:
//  - Upcoming Events: events with status==='published' and start >= now (small past buffer)
//  - Pending Requests: inquiries that are not yet pushed (pushed==false) OR status!='closed'
//  - Performers Confirmed: availability_responses with status==='yes' and eventStart >= now-1d
// =============================================
import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminDashboard.css';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  CollectionReference,
} from 'firebase/firestore';

// Helpers
const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
};

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = React.useState(0);
  const [pendingRequests, setPendingRequests] = React.useState(0);
  const [performersConfirmed, setPerformersConfirmed] = React.useState(0);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true); setErr(null);
      try {
        const nowMs = Date.now();
        const oneDayAgo = new Date(nowMs - 24 * 60 * 60 * 1000);

        // --- Upcoming Events ---
        const evCol = collection(db, 'events') as CollectionReference;
        const evQ = query(evCol, where('status', '==', 'published'));
        const evSnap = await getDocs(evQ);
        const upcoming = evSnap.docs.filter((d) => {
          const data = d.data() as any;
          const s = toDate(data.start)?.getTime();
          return typeof s === 'number' ? s >= nowMs - 2 * 60 * 60 * 1000 : false; // small 2h buffer
        }).length;
        setUpcomingEvents(upcoming);

        // --- Pending Requests (inquiries) ---
        const inqCol = collection(db, 'inquiries') as CollectionReference;
        // Pull all recent-ish; if you have many, consider filtering by createdAt >= last 90d
        const inqSnap = await getDocs(inqCol);
        const pending = inqSnap.docs.filter((d) => {
          const x = d.data() as any;
          // If a boolean pushed flag exists, use it; otherwise, use status != 'closed'
          if (typeof x.pushed === 'boolean') return x.pushed === false;
          return x.status !== 'closed';
        }).length;
        setPendingRequests(pending);

        // --- Performers Confirmed ---
        const flatCol = collection(db, 'availability_responses') as CollectionReference;
        // Single-field filter; remaining date filter is client-side to avoid composite idx
        const flatQ = query(flatCol, where('status', '==', 'yes'));
        const flatSnap = await getDocs(flatQ);
        const confirmed = flatSnap.docs.filter((d) => {
          const x = d.data() as any;
          const es = toDate(x.eventStart);
          return es ? es >= oneDayAgo : false; // count recent/upcoming confirmations
        }).length;
        setPerformersConfirmed(confirmed);
      } catch (e: any) {
        console.error('[AdminDashboard] Failed to load stats', e);
        setErr(e?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
        {loading ? (
          <div className="stat-card"><div className="stat-value">…</div><div className="stat-label">Loading…</div></div>
        ) : err ? (
          <div className="stat-card"><div className="stat-value">!</div><div className="stat-label">{err}</div></div>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-value">{upcomingEvents}</div>
              <div className="stat-label">Upcoming Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{pendingRequests}</div>
              <div className="stat-label">Pending Requests</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{performersConfirmed}</div>
              <div className="stat-label">Performers Confirmed</div>
            </div>
          </>
        )}
      </section>

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
