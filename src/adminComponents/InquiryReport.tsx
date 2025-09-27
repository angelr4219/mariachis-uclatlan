
// =============================================
// FILE: src/pages/admin/InquiryReport.tsx
// Purpose: React page to pick date range, fetch inquiries+YES, show table
// =============================================
import React from 'react';
import './InquiryReport.css';
import InquiryTable from './InquiryTable';
import { fetchInquiriesWithYes, hydrateNamesFromUsers, type InquiryRecord } from '../services/InquiryActions';;

const InquiryReport: React.FC = () => {
  const [start, setStart] = React.useState<string>(''); // yyyy-mm-dd
  const [end, setEnd] = React.useState<string>('');
  const [rows, setRows] = React.useState<InquiryRecord[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const range = {
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
      };
      let data = await fetchInquiriesWithYes(range);
      // (Optional) hydrate names from users if missing
      data = await hydrateNamesFromUsers(data);
      setRows(data);
    } catch (e) {
      console.error('[InquiryReport] load error', e);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  React.useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const header = ['Inquiry','Date','Status','Client','Yes Count','Yes Names'];
    const lines = rows.map(r => [
      csv(r.title),
      csv(r.date ? new Date(r.date).toLocaleDateString() : ''),
      csv(r.status || ''),
      csv(r.clientName || ''),
      String(r.yesCount),
      csv(r.yesList.map(y => y.name || y.userId).join('; ')),
    ].join(','));
    const blob = new Blob([[header.join(',')].concat(lines).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inquiry_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="iqr">
      <header className="iqr-header">
        <h1>Inquiry Report</h1>
        <p className="lead">View inquiries within a date range and see who marked YES.</p>
      </header>

      <div className="iqr-toolbar">
        <label>
          From
          <input type="date" value={start} onChange={e => setStart(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
        </label>
        <button onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
        <button onClick={exportCsv} disabled={loading || rows.length === 0}>Export CSV</button>
      </div>

      <InquiryTable rows={rows} loading={loading} />
    </section>
  );
};

export default InquiryReport;

function csv(s: string) {
  // Quote and escape for CSV
  const q = '"';
  if (s == null) return '';
  const need = /[",\n]/.test(s);
  const esc = s.replace(/"/g, '""');
  return need ? q + esc + q : esc;
}

