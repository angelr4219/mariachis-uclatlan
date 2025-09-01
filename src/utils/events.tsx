// src/utils/events.ts
import { Timestamp } from 'firebase/firestore';
import type { EventCardVM, EventDoc, EventItem } from '../types/events';

export function toDate(x?: Timestamp | Date | string | number): Date | undefined {
  if (!x) return undefined;
  if (x instanceof Timestamp) return x.toDate();
  if (x instanceof Date) return x;
  return new Date(x);
}

export function normalizeEvent(doc: EventDoc): EventItem {
  return {
    ...doc,
    start: toDate(doc.start)!,
    end: toDate(doc.end),
  };
}

// Overloads:
// 1) formatDateRange(start,end[,tz]) -> string
export function formatDateRange(start: Date, end?: Date, tz?: string): string;
// 2) formatDateRange(eventItem[,tz]) -> { date, time }
export function formatDateRange(e: EventItem, tz?: string): { date: string; time: string };
// Impl
export function formatDateRange(a: Date | EventItem, b?: Date | string, c?: string): any {
  const isEvent = typeof a === 'object' && 'start' in a && !(a instanceof Date);
  const timeZone = (isEvent ? (b as string | undefined) : (c as string | undefined)) || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dFmt: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeZone };
  const tFmt: Intl.DateTimeFormatOptions = { timeStyle: 'short', timeZone };

  if (isEvent) {
    const ev = a as EventItem;
    const date = new Intl.DateTimeFormat(undefined, dFmt).format(ev.start);
    const s = new Intl.DateTimeFormat(undefined, tFmt).format(ev.start);
    const e = ev.end ? new Intl.DateTimeFormat(undefined, tFmt).format(ev.end) : '';
    return { date, time: e ? `${s} – ${e}` : s };
  } else {
    const start = a as Date;
    const end = b as Date | undefined;
    const date = new Intl.DateTimeFormat(undefined, dFmt).format(start);
    const s = new Intl.DateTimeFormat(undefined, tFmt).format(start);
    const e = end ? new Intl.DateTimeFormat(undefined, tFmt).format(end) : '';
    return e ? `${date} • ${s} – ${e}` : `${date} • ${s}`;
  }
}

export function formatCardVM(e: EventItem, tz?: string): EventCardVM {
  const { date, time } = formatDateRange(e, tz);
  return {
    id: e.id,
    title: e.title,
    date,
    time,
    location: e.location || '',
    description: e.description || '',
    status: e.status,
  };
}
