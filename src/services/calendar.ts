// =============================================
// FILE: src/services/calendar.ts
// Description: unify Events + Inquiries into a single calendar feed
// =============================================
import {
    collection,
    onSnapshot,
    query,
    where,
    Timestamp,
    type Unsubscribe,
    type DocumentData,
    type QueryConstraint,
  } from 'firebase/firestore';
  import { db } from '../firebase';
  
  export type CalendarItem = {
    id: string;
    type: 'event' | 'inquiry';
    title: string;
    start: Date;
    end?: Date | null;
    location?: string | null;
    status?: string; // event: published/draft/cancelled, inquiry: new/in_progress/closed
    raw: DocumentData; // keep original for drill-through
  };
  
  function parseDate(val?: any, fallback?: Date): Date {
    if (!val && fallback) return fallback;
    if (!val) return new Date();
    if (val instanceof Timestamp) return val.toDate();
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(`${val}T12:00:00`);
      const d = new Date(val);
      return isNaN(+d) ? (fallback ?? new Date()) : d;
    }
    if (val instanceof Date) return val;
    return fallback ?? new Date();
  }
  
  export function subscribeEvents(
    opts: { statuses?: string[]; onChange: (items: CalendarItem[]) => void }
  ): Unsubscribe {
    const statuses = opts.statuses ?? ['published'];
    const constraints: QueryConstraint[] = [];
    if (statuses.length === 1) {
      constraints.push(where('status', '==', statuses[0]));
    } else if (statuses.length > 1) {
      constraints.push(where('status', 'in', statuses.slice(0, 10)));
    }
    const q = query(collection(db, 'events'), ...constraints);
    return onSnapshot(q, (snap) => {
      const items: CalendarItem[] = snap.docs.map((d) => {
        const data: any = d.data();
        const start = parseDate(data.start ?? data.date);
        const end = data.end ? parseDate(data.end) : null;
        const title = data.title ?? 'Untitled Event';
        return {
          id: d.id,
          type: 'event',
          title,
          start,
          end,
          location: data.location ?? null,
          status: data.status,
          raw: data,
        };
      });
      items.sort((a, b) => +a.start - +b.start);
      opts.onChange(items);
    });
  }
  
  export function subscribeCalendarFeedInquiries(onChange: (items: CalendarItem[]) => void): Unsubscribe {
    const q = query(collection(db, 'calendar_feed'));
    return onSnapshot(q, (snap) => {
      const items: CalendarItem[] = snap.docs.map((d) => {
        const data: any = d.data();
        const start = parseDate(data.start ?? data.date);
        const end = data.end ? parseDate(data.end) : null;
        const title = data.title ?? 'Client Inquiry';
        return {
          id: d.id,
          type: 'inquiry',
          title,
          start,
          end,
          location: data.location ?? null,
          status: data.status ?? 'new',
          raw: data,
        };
      });
      items.sort((a, b) => +a.start - +b.start);
      onChange(items);
    });
  }
  
  
  export function mergeCalendarFeeds(
    a: CalendarItem[],
    b: CalendarItem[]
  ): CalendarItem[] {
    const all = [...a, ...b];
    all.sort((x, y) => +x.start - +y.start);
    return all;
  }
  
 