
// =============================================
// FILE: src/components/events/RosterPanel.tsx (UPDATED)
// Desc: Simple panel that shows the roster for an event using services/roster
// =============================================
import React from 'react';
import { loadRosterFromAvailability, type RosterEntry } from '../../services/roster';

export type RosterPanelProps = {
  open: boolean;
  eventId: string | null;
  onClose: () => void;
  includeMaybe?: boolean;
};

const RosterPanel: React.FC<RosterPanelProps> = ({ open, eventId, onClose, includeMaybe = false }) => {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [rows, setRows] = React.useState<RosterEntry[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !eventId) return;
      setLoading(true); setErr('');
      try {
        const data = await loadRosterFromAvailability(eventId, includeMaybe);
        if (alive) setRows(data);
      } catch (e: any) {
        if (alive) setErr(e?.message || 'Failed to load roster');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, eventId, includeMaybe]);

  if (!open) return null;

  return (
    <div className="roster-modal" role="dialog" aria-modal="true">
      <div className="roster-card">
        <header className="roster-head">
          <h3>Event roster {includeMaybe ? '(Yes & Maybe)' : '(Yes only)'}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </header>
        {err && <p className="err" role="alert">{err}</p>}
        {loading && <p className="muted">Loading…</p>}
        {!loading && rows.length === 0 && <p className="muted">No matching responses.</p>}
        {!loading && rows.length > 0 && (
          <table className="roster-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Section</th>
                <th>Instrument</th>
                <th>Availability</th>
                <th>Hired?</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.uid}>
                  <td>{r.displayName}</td>
                  <td>{r.section || '—'}</td>
                  <td>{r.instrument || '—'}</td>
                  <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                  <td>{r.hired ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`
        .roster-modal { position: fixed; inset: 0; background: rgba(15,23,42,.35); display: grid; place-items: center; z-index: 40; }
        .roster-card { width: min(920px, 92vw); background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1rem; box-shadow: 0 20px 40px rgba(2,6,23,.18); }
        .roster-head { display:flex; align-items:center; justify-content: space-between; gap:.75rem; margin-bottom: .5rem; }
        .roster-card .muted { color: #64748b; }
        .roster-card .err { color: #b91c1c; font-weight: 700; }
        .badge { display:inline-block; padding:.1rem .45rem; border-radius:999px; font-weight:600; font-size:.8rem; border:1px solid #e5e7eb; }
        .badge.yes { background:#ecfdf5; color:#065f46; border-color:#a7f3d0; }
        .badge.maybe { background:#fff7ed; color:#7c2d12; border-color:#fed7aa; }
      `}</style>
    </div>
  );
};

export default RosterPanel;
