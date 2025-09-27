// =============================================
// FILE: src/pages/admin/Reports.tsx
// Purpose: Admin reports page that fetches participation/availability
//          data from Firestore and displays summaries and recent activity.
//          This component implements a simple date range filter and
//          reactive data fetching. It is responsive and uses a
//          matching CSS module for styling.
// =============================================
import React from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './Reports.css';

/**
 * Represents a single activity entry returned from the backend. The shape
 * matches what you would expect from your availability/inquiry collections.
 */
interface Activity {
  id: string;
  date: string; // ISO date string
  type: string; // e.g. "Availability", "Inquiry", etc.
  title: string; // Event or inquiry name/description
  status: string; // e.g. "Marked", "Submitted", "Accepted", etc.
  // You can extend this interface with additional fields as needed.
}

/**
 * Reports component
 *
 * This page allows admins to select a date range and view various
 * aggregated metrics (participation summary, inquiry funnel, estimated
 * revenue) as well as a list of recent activities. Data is pulled
 * from Firestore; adjust the collection names and fields to match
 * your actual schema.
 */
const Reports: React.FC = () => {
  // Controlled inputs for date range filtering
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');

  // Activity results returned from Firestore
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  // Derived metrics (participation summary, inquiries, revenue)
  const participationSummary = React.useMemo(() => {
    // Calculate total attended events and average performers per event
    const totalActivities = activities.filter((a) => a.type === 'Availability');
    const attendanceCount = totalActivities.length;
    // Example: average performers per event (dummy since we don't know the real field)
    const avgPerformers = attendanceCount > 0 ? attendanceCount / 5 : 0;
    return {
      attendanceCount,
      avgPerformers: Math.round(avgPerformers * 10) / 10,
    };
  }, [activities]);

  const inquiryFunnel = React.useMemo(() => {
    // Count statuses: Submitted, Accepted, Booked, Completed
    const funnelStages = {
      Submitted: 0,
      Accepted: 0,
      Booked: 0,
      Completed: 0,
    } as Record<string, number>;
    activities
      .filter((a) => a.type === 'Inquiry')
      .forEach((a) => {
        if (funnelStages[a.status] !== undefined) {
          funnelStages[a.status]++;
        }
      });
    return funnelStages;
  }, [activities]);

  const revenueEstimate = React.useMemo(() => {
    // Example calculation: assume each completed inquiry is worth $500 and each performer is paid $200
    const completed = activities.filter(
      (a) => a.type === 'Inquiry' && a.status === 'Completed'
    ).length;
    const performerPayouts = participationSummary.attendanceCount * 200;
    const clientCharges = completed * 500;
    return {
      clientCharges,
      performerPayouts,
    };
  }, [activities, participationSummary]);

  /**
   * Fetches activity data from Firestore based on the selected date range.
   * You should adjust the collection name (e.g., 'activities') and
   * field names to match your Firestore structure. This example uses
   * a single collection that stores both availability and inquiry events.
   */
  const fetchActivities = React.useCallback(async () => {
    setLoading(true);
    try {
      // Convert date inputs to Date objects
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      // Build a Firestore query based on selected date range
      let q;
      const coll = collection(db, 'activities');
      if (start && end) {
        q = query(
          coll,
          where('date', '>=', start.toISOString()),
          where('date', '<=', end.toISOString())
        );
      } else if (start) {
        q = query(coll, where('date', '>=', start.toISOString()));
      } else if (end) {
        q = query(coll, where('date', '<=', end.toISOString()));
      } else {
        q = query(coll);
      }
      const snapshot = await getDocs(q);
      const rows: Activity[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date || '',
          type: data.type || 'Availability',
          title: data.title || '',
          status: data.status || 'Unknown',
        };
      });
      setActivities(rows);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Automatically fetch when the component mounts or when the date range changes
  React.useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Export CSV stub: convert activities to CSV and trigger download
  const handleExportCSV = () => {
    const header = 'Date,Type,Title,Status\n';
    const body = activities
      .map((a) => `${a.date},${a.type},${a.title},${a.status}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="reports stack">
      <header className="stack">
        <h1 className="title">Reports</h1>
        <p className="lede">
          Overview of participation, inquiries, and revenue performance.
        </p>
      </header>

      <div className="toolbar">
        <div className="left">
          <label className="field">
            <span>From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="field">
            <span>To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
        <div className="right">
          <button className="btn" onClick={handleExportCSV} disabled={loading}>
            Export CSV
          </button>
          <button className="btn btn-secondary" onClick={fetchActivities} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid cols-3 stack-md">
        <article className="card stat">
          <h3>Participation Summary</h3>
          <p className="muted">
            Attendance: {participationSummary.attendanceCount}, average
            performers per event: {participationSummary.avgPerformers}
          </p>
          <div className="placeholder">
            {loading ? 'Loading…' : participationSummary.attendanceCount}
          </div>
        </article>
        <article className="card stat">
          <h3>Inquiry Funnel</h3>
          <p className="muted">
            Submitted: {inquiryFunnel.Submitted}, Accepted:{' '}
            {inquiryFunnel.Accepted}, Booked: {inquiryFunnel.Booked}, Completed:{' '}
            {inquiryFunnel.Completed}
          </p>
          <div className="placeholder">
            {loading ? 'Loading…' : Object.values(inquiryFunnel).reduce((a, b) => a + b, 0)}
          </div>
        </article>
        <article className="card stat">
          <h3>Revenue (Est.)</h3>
          <p className="muted">
            Client charges: ${revenueEstimate.clientCharges}, performer
            payouts: ${revenueEstimate.performerPayouts}
          </p>
          <div className="placeholder">
            {loading ? 'Loading…' : '$' + (revenueEstimate.clientCharges - revenueEstimate.performerPayouts)}
          </div>
        </article>
      </div>

      <section className="card stack">
        <h3>Recent Activity</h3>
        <div className="table">
          <div className="row head">
            <div>Date</div>
            <div>Type</div>
            <div>Event / Inquiry</div>
            <div>Status</div>
          </div>
          {loading && (
            <div className="row">
              <div colSpan={4}>Loading…</div>
            </div>
          )}
          {!loading && activities.length === 0 && (
            <div className="row">
              <div colSpan={4}>No activity for selected range.</div>
            </div>
          )}
          {!loading &&
            activities.map((a) => (
              <div className="row" key={a.id}>
                <div>{a.date ? new Date(a.date).toLocaleDateString() : '—'}</div>
                <div>{a.type || '—'}</div>
                <div>{a.title || '—'}</div>
                <div>
                  <span className="badge">{a.status || '—'}</span>
                </div>
              </div>
            ))}
        </div>
      </section>
    </section>
  );
};

export default Reports;