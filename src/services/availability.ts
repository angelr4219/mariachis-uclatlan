// =============================================================
// FILE: src/services/availability.ts
// Purpose: Query availability WITHOUT needing composite indexes
// Strategy:
//  1) Avoid collectionGroup() and composite orderBy combinations.
//  2) Read per-parent subcollections: {source}/{id}/availability
//  3) Do any sorting/aggregation in memory on the client.
// =============================================================
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';

export type Source = 'events' | 'inquiries';
export type RSVP = 'yes' | 'maybe' | 'no' | '';

export type AvailabilityRow = {
  uid: string;
  status: RSVP;
  finalized?: boolean;
  eventId?: string | null;
  eventTitle?: string | null;
  eventStart?: any;
  eventEnd?: any;
  [k: string]: unknown;
};

/**
 * Read ALL availability docs for a single parent (event or inquiry).
 * No orderBy — sort in memory to avoid composite indexes.
 */
export const listAvailabilityForParent = async (
  source: Source,
  id: string,
  opts?: { statusEquals?: RSVP }
): Promise<AvailabilityRow[]> => {
  const base = collection(db, source, id, 'availability');
  const q = opts?.statusEquals
    ? query(base, where('status', '==', opts.statusEquals))
    : base;
  const snap = await getDocs(q);
  const rows: AvailabilityRow[] = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as DocumentData) })) as any;
  return rows;
};

/**
 * Aggregate simple counts for a parent (no index required).
 */
export const countAvailabilityForParent = async (
  source: Source,
  id: string
): Promise<{ yes: number; maybe: number; no: number; total: number; finalized: number }> => {
  const rows = await listAvailabilityForParent(source, id);
  let yes = 0, maybe = 0, no = 0, total = 0, finalized = 0;
  for (const r of rows) {
    total++;
    if (r.status === 'yes') yes++;
    else if (r.status === 'maybe') maybe++;
    else if (r.status === 'no') no++;
    if (r.finalized) finalized++;
  }
  return { yes, maybe, no, total, finalized };
};

/**
 * Example: sort by eventStart on the client.
 */
export const sortAvailabilityByStart = (rows: AvailabilityRow[]) => {
  return [...rows].sort((a, b) => {
    const ta = (a.eventStart && (a.eventStart.toMillis ? a.eventStart.toMillis() : new Date(a.eventStart).getTime())) || 0;
    const tb = (b.eventStart && (b.eventStart.toMillis ? b.eventStart.toMillis() : new Date(b.eventStart).getTime())) || 0;
    return ta - tb;
  });
};
