// =============================================================
// FILE: src/pages/admin/Report.tsx
// Purpose: Build XLSX reports straight from flat `availability` docs
// Reports:
//  1) Performance Book — all events and participants
//  2) Biweekly Timesheet Reference — grouped by 14-day pay periods
//  3) **On-screen Preview** — per-pay-period table of finalized attendees + per-performer totals
// Notes:
//  - Avoids composite indexes: query on a single field per request, then filter/sort in memory.
//  - Reads from `availability` (status == 'yes' filter done in memory when a date range is used).
//  - Enriches rows with event meta from `events/{eventId}`.
//  - Comp time = hours between start & end (prefer availability.eventStart/End; fallback to event doc).
//  - Date range filter applies to eventStart.
// =============================================================
import React from 'react';
import * as XLSX from 'xlsx';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import './Reports.css';

// ---------- helpers ----------
const toDate = (v: any): Date | null => {
  if (!v && v !== 0) return null;
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) return (v as Timestamp).toDate();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const fmtISO = (d: Date | null): string =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';

const hrs = (start: Date | null, end: Date | null): number | '' => {
  if (!start || !end) return '';
  const val = (end.getTime() - start.getTime()) / 36e5;
  return Math.round(Math.max(0, val) * 100) / 100; // 2 decimals
};

const payKey = (d: Date, anchor: Date) => {
  const dayMs = 24 * 60 * 60 * 1000;
  const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const idx = Math.floor((dd.getTime() - a.getTime()) / dayMs / 14);
  const start = new Date(a.getTime() + idx * 14 * dayMs);
  const end = new Date(start.getTime() + 13 * dayMs);
  return `${fmtISO(start)} to ${fmtISO(end)}`;
};

// shape we export / preview
export type Row = {
  dateISO: string;
  performer: string;
  client: string;
  eventName: string;
  comp: number | '';
};

// ---------- Firestore loaders (no composite indexes) ----------
/**
 * Load availability rows while avoiding composite indexes:
 * - If a date range is provided, query ONLY by eventStart range, then filter status/finalized in memory.
 * - If no date range, query by status == 'yes' (single-field), then filter finalized in memory.
 */
const loadYesAvailability = async (opts: {
  onlyFinalized: boolean;
  from?: Date | null;
  to?: Date | null;
}): Promise<any[]> => {
  const col = collection(db, 'availability');

  // Case 1: Date range provided => query on eventStart only
  if (opts.from || opts.to) {
    const clauses: any[] = [];
    if (opts.from) clauses.push(where('eventStart', '>=', Timestamp.fromDate(opts.from)));
    if (opts.to) clauses.push(where('eventStart', '<=', Timestamp.fromDate(opts.to)));
    const qRef = clauses.length ? query(col, ...clauses) : col;
    const snap = await getDocs(qRef);
    // Filter in memory to avoid composite index requirements
    const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as { status?: string; finalized?: boolean }) }));
    return all.filter((r) => {
      const statusOK = (r.status || '') === 'yes';
      const finOK = !opts.onlyFinalized || !!r.finalized;
      return statusOK && finOK;
    });
  }

  // Case 2: No date range => single-field query on status
  const qRef = query(col, where('status', '==', 'yes'));
  const snap = await getDocs(qRef);
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }));
  return all.filter((r) => (!opts.onlyFinalized || !!(r as { finalized?: boolean }).finalized));
};

const buildEventMeta = async (ids: string[]) => {
  const out = new Map<string, any>();
  await Promise.all(
    Array.from(new Set(ids)).map(async (id) => {
      try {
        const ds = await getDoc(doc(db, 'events', id));
        out.set(id, ds.exists() ? ds.data() : {});
      } catch {
        out.set(id, {});
      }
    })
  );
  return out;
};

const rowsFromAvailability = async (list: any[]): Promise<Row[]> => {
  const eventIds = list.map((a) => a.eventId).filter(Boolean) as string[];
  const meta = await buildEventMeta(eventIds);

  const rows: Row[] = list.map((a) => {
    const m = meta.get(a.eventId) || {};
    const start = toDate(a.eventStart) || toDate((m as any).start) || toDate((m as any).date);
    const end = toDate(a.eventEnd) || toDate((m as any).end) || null;
    const client = (m as any).client || (m as any).dept || '';
    const eventName = a.eventTitle || (m as any).title || '';
    return {
      dateISO: fmtISO(start),
      performer: a.displayName || a.name || a.email || 'Unknown',
      client,
      eventName,
      comp: hrs(start, end),
    };
  });

  // Sort on client (stable) to keep Firestore query simple
  rows.sort(
    (a, b) =>
      String(a.dateISO).localeCompare(String(b.dateISO)) ||
      String(a.eventName).localeCompare(String(b.eventName)) ||
      String(a.performer).localeCompare(String(b.performer))
  );

  return rows;
};

// ---------- grouping for preview ----------
const buildBiweeklyPreview = (rows: Row[], anchorISO: string) => {
  const anchor = new Date(anchorISO + 'T00:00:00');
  type PeriodData = { rows: Row[]; totals: Record<string, number>; totalHours: number };
  const map = new Map<string, PeriodData>();

  for (const r of rows) {
    const d = r.dateISO ? new Date(r.dateISO + 'T00:00:00') : null;
    const key = d ? payKey(d, anchor) : 'Unknown Period';
    if (!map.has(key)) map.set(key, { rows: [], totals: {}, totalHours: 0 });
    const bucket = map.get(key)!;
    bucket.rows.push(r);
    const hours = typeof r.comp === 'number' ? r.comp : 0;
    bucket.totalHours += hours;
    bucket.totals[r.performer] = (bucket.totals[r.performer] || 0) + hours;
  }

  // sort rows within period by date → event → performer
  for (const b of map.values()) {
    b.rows.sort(
      (a, b) =>
        String(a.dateISO).localeCompare(String(b.dateISO)) ||
        String(a.eventName).localeCompare(String(b.eventName)) ||
        String(a.performer).localeCompare(String(b.performer))
    );
  }

  return map;
};

// ---------- component ----------
const Reports: React.FC = () => {
  const [onlyFinalized, setOnlyFinalized] = React.useState(true);
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [anchor, setAnchor] = React.useState<string>('2025-06-23');
  const [busy, setBusy] = React.useState<'none' | 'perf' | 'biweekly' | 'preview'>('none');
  const [error, setError] = React.useState<string>('');
  const [preview, setPreview] = React.useState<Map<string, { rows: Row[]; totals: Record<string, number>; totalHours: number }>>(new Map());

  const parseDate = (s: string) => (s ? new Date(s + 'T00:00:00') : null);

  const rebuildPreview = async () => {
    setBusy('preview');
    setError('');
    try {
      const list = await loadYesAvailability({ onlyFinalized, from: parseDate(from), to: parseDate(to) });
      const rows = await rowsFromAvailability(list);
      const map = buildBiweeklyPreview(rows, anchor);
      setPreview(map);
    } catch (e: any) {
      setError(e?.message || 'Failed to build preview');
    } finally {
      setBusy('none');
    }
  };

  React.useEffect(() => {
    // auto-build on mount and whenever filters change
    void rebuildPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyFinalized, from, to, anchor]);

  const exportPerformanceBook = async () => {
    setBusy('perf');
    setError('');
    try {
      const list = await loadYesAvailability({ onlyFinalized, from: parseDate(from), to: parseDate(to) });
      const rows = await rowsFromAvailability(list);
      const header = ['Date of Performance', 'Performer Name', 'Dept/Client', 'Event Name', 'Comp Time'];
      const aoa = [header, ...rows.map((r) => [r.dateISO, r.performer, r.client, r.eventName, r.comp])];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Performance Book');
      XLSX.writeFile(wb, '2025-2026 Performance Book.xlsx');
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    } finally {
      setBusy('none');
    }
  };

  const exportBiweekly = async () => {
    setBusy('biweekly');
    setError('');
    try {
      const list = await loadYesAvailability({ onlyFinalized, from: parseDate(from), to: parseDate(to) });
      const rows = await rowsFromAvailability(list);
      const anchorDate = new Date(anchor + 'T00:00:00');

      const buckets = new Map<string, Row[]>();
      for (const r of rows) {
        const d = r.dateISO ? new Date(r.dateISO + 'T00:00:00') : null;
        const key = d ? payKey(d, anchorDate) : 'Unknown Period';
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(r);
      }

      const wb = XLSX.utils.book_new();
      const keys = Array.from(buckets.keys()).sort();
      for (const k of keys) {
        const header = ['Date of Performance', 'Performer Name', 'Dept/Client', 'Event Name', 'Comp Time'];
        const sheetRows = buckets.get(k)!;
        const aoa = [[`Pay Period: ${k}`], header, ...sheetRows.map((r) => [r.dateISO, r.performer, r.client, r.eventName, r.comp])];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, k.slice(0, 31));
      }
      XLSX.writeFile(wb, '2025-2026 Timesheet Reference.xlsx');
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    } finally {
      setBusy('none');
    }
  };

  return (
    <section className="report-exports">
      <header className="stack">
        <h1 className="ucla-heading-xl">Reports & Exports</h1>
        <p className="muted">
          Exports are powered directly by <code>availability</code> responses.
        </p>
      </header>

      <div className="toolbar">
        <label className="field">
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field">
          <span>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="field checkbox">
          <input type="checkbox" checked={onlyFinalized} onChange={(e) => setOnlyFinalized(e.target.checked)} />
          <span>Only finalized</span>
        </label>
        <div className="spacer" />
        <label className="field">
          <span>Biweekly Anchor</span>
          <input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} />
        </label>
        <button className="btn" onClick={rebuildPreview} disabled={busy !== 'none'}>
          {busy === 'preview' ? 'Refreshing…' : 'Refresh Preview'}
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      {/* On-screen biweekly preview */}
      <div className="preview-grid">
        {Array.from(preview.keys()).sort().map((periodKey) => {
          const data = preview.get(periodKey)!;
          const totalsEntries = Object.entries(data.totals).sort((a, b) => a[0].localeCompare(b[0]));
          return (
            <section className="period-card" key={periodKey}>
              <header className="period-head">
                <h3>Pay Period: {periodKey}</h3>
                <span className="chip">Total Hours: {Math.round(data.totalHours * 100) / 100}</span>
              </header>

              <div className="table-wrap">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Event</th>
                      <th>Performer</th>
                      <th className="num">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.dateISO || '—'}</td>
                        <td>{r.eventName || 'Untitled'}</td>
                        <td>{r.performer}</td>
                        <td className="num">{typeof r.comp === 'number' ? r.comp : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="totals">
                <h4>Totals by Performer</h4>
                <table className="reports-table compact">
                  <thead>
                    <tr>
                      <th>Performer</th>
                      <th className="num">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totalsEntries.map(([name, h]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td className="num">{Math.round(h * 100) / 100}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      <div className="actions">
        <button className="btn" onClick={exportPerformanceBook} disabled={busy !== 'none'}>
          {busy === 'perf' ? 'Building…' : 'Export Performance Book (.xlsx)'}
        </button>
        <button className="btn-primary" onClick={exportBiweekly} disabled={busy !== 'none'}>
          {busy === 'biweekly' ? 'Building…' : 'Export Biweekly Reference (.xlsx)'}
        </button>
      </div>

      <p className="muted">
        Columns in both exports: <strong>Date of Performance</strong>, <strong>Performer Name</strong>,{' '}
        <strong>Dept/Client</strong>, <strong>Event Name</strong>, <strong>Comp Time</strong>.
      </p>
    </section>
  );
};

export default Reports;
