
// =============================================
// FILE: src/components/reports/InquiryTable.tsx
// Purpose: Present the inquiries + YES lists in a nice table with expand rows
// =============================================
import React from 'react';
import type { InquiryRecord } from '../services/InquiryActions';
import './InquiryTable.css';

interface Props {
  rows: InquiryRecord[];
  loading?: boolean;
}

const InquiryTable: React.FC<Props> = ({ rows, loading }) => {
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="iq-table">
      <table>
        <thead>
          <tr>
            <th style={{width: '28%'}}>Inquiry</th>
            <th style={{width: '18%'}}>Date</th>
            <th style={{width: '16%'}}>Status</th>
            <th style={{width: '20%'}}>Client</th>
            <th style={{width: '10%'}}>Yes</th>
            <th style={{width: '8%'}}></th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={6} className="muted">Loading…</td></tr>
          )}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={6} className="muted">No inquiries found for this range.</td></tr>
          )}
          {!loading && rows.map((r) => (
            <React.Fragment key={r.id}>
              <tr>
                <td>
                  <div className="iq-title">{r.title}</div>
                  {r.location && <div className="iq-subtle">{r.location}</div>}
                </td>
                <td>{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                <td>{r.status || '—'}</td>
                <td>{r.clientName || '—'}</td>
                <td><strong>{r.yesCount}</strong></td>
                <td>
                  {r.yesCount > 0 && (
                    <button className="link" onClick={() => toggle(r.id)}>
                      {open[r.id] ? 'Hide' : 'View'}
                    </button>
                  )}
                </td>
              </tr>
              {open[r.id] && r.yesCount > 0 && (
                <tr className="expand">
                  <td colSpan={6}>
                    <ul className="yes-list">
                      {r.yesList.map((y) => (
                        <li key={y.userId}>
                          <span>{y.name || y.userId}</span>
                          {y.updatedAt && (
                            <span className="iq-subtle"> • updated {new Date(y.updatedAt).toLocaleString()}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InquiryTable;

