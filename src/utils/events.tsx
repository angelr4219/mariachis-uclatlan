import { Timestamp } from 'firebase/firestore';
import type { EventDoc, EventItem } from '../types/events';

export function toDate(x?: Timestamp | Date | string | number | null): Date | null {
  if (x == null) return null;
  if (x instanceof Date) return isNaN(+x) ? null : x;
  if (x instanceof Timestamp) return x.toDate();
  const d = new Date(x as any);
  return isNaN(d.getTime()) ? null : d;
}

/** Convert Firestore EventDoc-ish into EventItem with JS Dates. Safe for partial/legacy docs. */
export function normalizeEvent(src: Partial<EventDoc> & { id: string }): EventItem {
  return {
    id: src.id,
    title: src.title ?? 'Untitled Event',
    start: toDate(src.start),
    end: toDate(src.end),
    location: src.location ?? '',
    description: src.description ?? '',
    status: (src.status as any) ?? 'draft',
    rolesNeeded: src.rolesNeeded ?? [],
    assignedUids: src.assignedUids ?? [],
    client: src.client ?? null,
    createdBy: src.createdBy ?? '',
    createdAt: toDate(src.createdAt) ?? Date.now(),
    updatedAt: toDate(src.updatedAt) ?? Date.now(),
    publishedAt: toDate(src.publishedAt) ?? undefined,
  };
}

/** Overloads */
export function formatDateRange(start: Date, end?: Date, tz?: string): string;
export function formatDateRange(e: EventItem, tz?: string): { date: string; time: string };
export function formatDateRange(a: Date | EventItem, b?: Date | string, c?: string): any {
  const isEvent = typeof a === 'object' && 'start' in a && !(a instanceof Date);
  const timeZone = (isEvent ? (b as string | undefined) : (c as string | undefined)) ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dFmt: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeZone };
  const tFmt: Intl.DateTimeFormatOptions = { timeStyle: 'short', timeZone };

  if (isEvent) {
    const ev = a as EventItem;
    const s = ev.start ? new Intl.DateTimeFormat(undefined, tFmt).format(ev.start) : '';
    const e = ev.end ? new Intl.DateTimeFormat(undefined, tFmt).format(ev.end) : '';
    const date = ev.start
      ? new Intl.DateTimeFormat(undefined, dFmt).format(ev.start)
      : (ev.end ? new Intl.DateTimeFormat(undefined, dFmt).format(ev.end) : '—');
    return { date, time: s && e ? `${s} – ${e}` : s || e || '' };
  } else {
    const start = a as Date;
    const end = b as Date | undefined;
    const date = new Intl.DateTimeFormat(undefined, dFmt).format(start);
    const s = new Intl.DateTimeFormat(undefined, tFmt).format(start);
    const e = end ? new Intl.DateTimeFormat(undefined, tFmt).format(end) : '';
    return e ? `${date} • ${s} – ${e}` : `${date} • ${s}`;
  }
}
