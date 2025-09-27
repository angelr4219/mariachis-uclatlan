
// =============================================
// FILE: src/pages/admin/ParticipationReport.tsx
// Purpose: Admin view to see who is going, event financials, and control status
// =============================================
import React from 'react';
import './ParticipationReport.css';
import {
  getEventsWithParticipation,
  publishEvent,
  hideEvent,
  cancelEvent,
  deleteEventWithParticipation,
  type AdminEventWithTotals,
} from '../services/adminEvents.ts';
import { Timestamp } from 'firebase/firestore';

const fmtDate = (t?: Timestamp | null) => {
  if (!t) return '—';
  const d = t.toDate();
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const money = (n: number | null | undefined) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '—');

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`status badge ${status}`}>{status}</span>
);

const ParticipationReport: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [events, setEvents] = React.useState<AdminEventWithTotals[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'published' | 'draft' | 'hidden' | 'canceled'>('all');
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    const statusIn = filter === 'all' ? undefined : [filter];
    const data = await getEventsWithParticipation({ statusIn: statusIn as any });
    setEvents(data);
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => (!q || e.title.toLowerCase().includes(q)));
  }, [events, search]);

  return (
    <section className="participation-page">
      <h1>Participation & Event Financials</h1>

      <div className="toolbar">
        <input
          placeholder="Search events by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="hidden">Hidden</option>
          <option value="canceled">Canceled</option>
        </select>
        <button onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Reload'}</button>
      </div>

      {filtered.map((ev) => (
        <details key={ev.id} className="event-card">
          <summary>
            <div className="ev-summary">
              <div className="ev-title">
                <h3>{ev.title}</h3>
                <div className="meta">
                  <span>{fmtDate(ev.date)}</span>
                  <span>• {ev.startTime ?? '—'}–{ev.endTime ?? '—'}</span>
                  <span>• {ev.venue ?? '—'}</span>
                </div>
              </div>
              <div className="ev-stats">
                <StatusBadge status={ev.status} />
                <div className="kpis">
                  <div><small>Going</small><strong>{ev.totals.headcountGoing}</strong></div>
                  <div><small>Comp Hours</small><strong>{ev.totals.totalCompHours.toFixed(2)}</strong></div>
                  <div><small>Total Payout</small><strong>{money(ev.totals.totalPayout)}</strong></div>
                  <div><small>Client Charge</small><strong>{money(ev.clientCharge)}</strong></div>
                </div>
              </div>
            </div>
          </summary>

          <div className="ev-actions">
            <button onClick={() => publishEvent(ev.id)}>Publish</button>
            <button onClick={() => hideEvent(ev.id)}>Hide</button>
            <button onClick={() => cancelEvent(ev.id)}>Cancel</button>
            <button className="danger" onClick={() => {
              const ok = confirm('Delete event and all participation? This cannot be undone.');
              if (ok) void deleteEventWithParticipation(ev.id).then(load);
            }}>Delete</button>
          </div>

          <div className="ev-financials">
            <h4>Financial Summary</h4>
            <table>
              <thead>
                <tr>
                  <th>Hourly Rate</th>
                  <th>Event Duration (hrs)</th>
                  <th>Headcount (Going)</th>
                  <th>Total Comp Hours</th>
                  <th>Total Payout</th>
                  <th>Client Charge</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{money(ev.hourlyRate ?? null)}</td>
                  <td>{ev.eventDurationHours ?? '—'}</td>
                  <td>{ev.totals.headcountGoing}</td>
                  <td>{ev.totals.totalCompHours.toFixed(2)}</td>
                  <td>{money(ev.totals.totalPayout)}</td>
                  <td>{money(ev.clientCharge)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="ev-participants">
            <h4>Who’s Going</h4>
            <table>
              <thead>
                <tr>
                  <th>Performer</th>
                  <th>Status</th>
                  <th>Compensated Time (hrs)</th>
                  <th>Rate ($/hr)</th>
                  <th>Performer Payout</th>
                </tr>
              </thead>
              <tbody>
                {ev.participants.filter(p => p.status === 'going').map((p) => {
                  const hrs = (p.compensatedHours ?? ev.eventDurationHours ?? 0) as number;
                  const rate = (p.hourlyRateOverride ?? ev.hourlyRate ?? 0) as number;
                  const pay = hrs * rate;
                  return (
                    <tr key={p.uid}>
                      <td>{p.name ?? p.uid}</td>
                      <td>{p.status}</td>
                      <td>{typeof hrs === 'number' ? hrs.toFixed(2) : '—'}</td>
                      <td>{money(rate)}</td>
                      <td>{money(pay)}</td>
                    </tr>
                  );
                })}
                {ev.participants.filter(p => p.status === 'going').length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.65 }}>No confirmed performers yet.</td></tr>
                )}
              </tbody>
            </table>

            <details className="others">
              <summary>View others (maybe/declined/unknown)</summary>
              <table>
                <thead>
                  <tr>
                    <th>Performer</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {ev.participants.filter(p => p.status !== 'going').map((p) => (
                    <tr key={p.uid}>
                      <td>{p.name ?? p.uid}</td>
                      <td>{p.status ?? 'unknown'}</td>
                      <td>—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        </details>
      ))}

      {!loading && filtered.length === 0 && (
        <p style={{ opacity: 0.7 }}>No events match your filter.</p>
      )}
    </section>
  );
};

export default ParticipationReport;

