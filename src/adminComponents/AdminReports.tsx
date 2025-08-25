// src/adminComponents/AdminReports.tsx
import React, { useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  Timestamp,
  CollectionReference,
} from 'firebase/firestore';
import { db } from '../firebase';

// -------- Types --------
export type EventItem = {
  id: string;
  title: string;
  start?: Date | Timestamp | string | null;
  end?: Date | Timestamp | string | null;
};

export type Availability = {
  uid: string;
  status: 'yes' | 'no' | 'maybe' | string;
};

// -------- Helpers --------
const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  // ISO string or number
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
};

const toIso = (v: any): string => {
  const d = toDate(v);
  return d ? d.toISOString() : '';
};

const csvEscape = (val: any): string => {
    // 1. Convert anything (null, number, object, etc.) into a string.
    const s = String(val ?? '');
  
    // 2. Check if the string contains any special characters
    //    that could break CSV parsing:
    //    - double quotes (")
    //    - commas (,)
    //    - newlines (\n)
    if (/[",\n]/.test(s)) {
      // If so, wrap the whole thing in double quotes
      // and escape any internal quotes by doubling them (" → "")
      return '"' + s.replace(/"/g, '""') + '"';
    }
  
    // 3. If no special chars, just return the raw string
    return s;
  };
  

const toCsv = (rows: Array<Record<string, any>>): string => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(','));
  }
  return lines.join('\n');
};

const download = (filename: string, text: string, mime = 'text/csv;charset=utf-8') => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// -------- Firestore fetchers --------
const fetchEvents = async (): Promise<EventItem[]> => {
  // Expected collection: events
  const q = query(collection(db, 'events') as CollectionReference, orderBy('start', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as EventItem[];
};

const fetchAvailability = async (eventId: string): Promise<Availability[]> => {
  // Prefer subcollection: events/{eventId}/availability
  try {
    const sub = collection(db, 'events', eventId, 'availability');
    const subSnap = await getDocs(sub);
    if (!subSnap.empty) {
      return subSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Availability[];
    }
  } catch (e) {
    // fall through to top-level query
  }

  // Fallback: top-level availability with eventId field
  const topQ = query(collection(db, 'availability'), where('eventId', '==', eventId));
  const topSnap = await getDocs(topQ);
  return topSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Availability[];
};

const AdminReports: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const exportSummaryCsv = async () => {
    setErr(null); setBusy(true);
    try {
      const events = await fetchEvents();
      const rows: Array<Record<string, any>> = [];
      for (const ev of events) {
        const avails = await fetchAvailability(ev.id);
        const agg: Record<string, number> = { yes: 0, maybe: 0, no: 0 };
        for (const a of avails) {
          const k = (a.status || '').toLowerCase();
          if (k in agg) agg[k]++;
        }
        rows.push({
          Event: ev.title || ev.id,
          Start: toIso(ev.start),
          End: toIso(ev.end),
          Yes: agg.yes || 0,
          Maybe: agg.maybe || 0,
          No: agg.no || 0,
        });
      }
      download('availability-summary.csv', toCsv(rows));
    } catch (e: any) {
      console.error(e); setErr(e?.message || 'Failed to export summary');
    } finally {
      setBusy(false);
    }
  };

  const exportDetailedCsv = async () => {
    setErr(null); setBusy(true);
    try {
      const events = await fetchEvents();
      const out: any[] = [];
      for (const ev of events) {
        const avails = await fetchAvailability(ev.id);
        for (const a of avails) {
          out.push({
            eventId: ev.id,
            title: ev.title,
            uid: (a as any).uid,
            status: (a as any).status,
            start: toIso(ev.start),
            end: toIso(ev.end),
          });
        }
      }
      download('availability-detailed.csv', toCsv(out));
    } catch (e: any) {
      console.error(e); setErr(e?.message || 'Failed to export detailed');
    } finally {
      setBusy(false);
    }
  };

  // Optional PDF export using jsPDF (install first):
  // npm i jspdf jspdf-autotable
  const exportSummaryPdf = async () => {
    setErr(null); setBusy(true);
    try {
      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const doc = new jsPDF();

      // Title
      doc.setFontSize(14);
      doc.text('Availability Summary', 14, 16);

      // Build rows
      const events = await fetchEvents();
      const rows: any[] = [];
      for (const ev of events) {
        const avails = await fetchAvailability(ev.id);
        const agg: Record<string, number> = { yes: 0, maybe: 0, no: 0 };
        avails.forEach((a) => {
          const k = (a.status || '').toLowerCase();
          if (k in agg) agg[k]++;
        });
        rows.push([
          ev.title,
          toDate(ev.start)?.toLocaleString?.() || '',
          toDate(ev.end)?.toLocaleString?.() || '',
          agg.yes || 0,
          agg.maybe || 0,
          agg.no || 0,
        ]);
      }

      (autoTableMod as any).default(doc, {
        head: [["Event", "Start", "End", "Yes", "Maybe", "No"]],
        body: rows,
        startY: 22,
      });

      doc.save('availability-summary.pdf');
    } catch (e: any) {
      console.error(e); setErr(e?.message || 'Failed to export PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ucla-content" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 className="ucla-heading-xl">Reports</h1>
      <p>Export availability across events.</p>
      {err && <p style={{ color: 'salmon' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button disabled={busy} onClick={exportSummaryCsv}>Export Summary (CSV)</button>
        <button disabled={busy} onClick={exportDetailedCsv}>Export Detailed (CSV)</button>
        <button disabled={busy} onClick={exportSummaryPdf}>Export Summary (PDF)</button>
      </div>
      <p style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
        For PDF export, run: <code>npm i jspdf jspdf-autotable</code>
      </p>
    </section>
  );
};

export default AdminReports;
