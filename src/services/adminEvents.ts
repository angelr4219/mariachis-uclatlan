
// =============================================
// FILE: src/services/adminEvents.ts
// Purpose: Admin helpers to load events + participation and mutate event status
// =============================================
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export type EventStatus = 'draft' | 'published' | 'hidden' | 'canceled';

export interface Participant {
  uid: string;
  name?: string;
  status?: 'going' | 'maybe' | 'declined' | 'unknown';
  compensatedHours?: number | null; // if null, fall back to eventDurationHours
  hourlyRateOverride?: number | null; // optional per-performer override
}

export interface AdminEvent {
  id: string;
  title: string;
  date: Timestamp | null; // event date (day)
  startTime?: string | null; // optional HH:MM
  endTime?: string | null;   // optional HH:MM
  eventDurationHours?: number | null; // fallback if per-performer hours missing
  hourlyRate?: number | null; // $/hr
  clientCharge?: number | null; // flat client charge for the event
  status: EventStatus;
  venue?: string | null;
  notes?: string | null;
  participants: Participant[];
}

export interface AdminEventWithTotals extends AdminEvent {
  totals: {
    headcountGoing: number;
    totalCompHours: number; // sum of all compensated hours for GOING only
    totalPayout: number;    // sum of all per-performer payouts for GOING only
  };
}

const coerceNumber = (v: any, dflt = 0): number => (typeof v === 'number' && !Number.isNaN(v) ? v : dflt);
const coerceString = (v: any, dflt: string | null = null) => (typeof v === 'string' ? v : dflt);

/** Compute hours between HH:MM 24h strings (simple helper if duration not stored). */
export const hoursBetween = (start?: string | null, end?: string | null): number | null => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some((x) => Number.isNaN(x))) return null;
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const diffMin = endMin - startMin;
  return diffMin > 0 ? diffMin / 60 : null;
};

/** Load a single event's participation subcollection. */
export const getParticipants = async (eventId: string): Promise<Participant[]> => {
  const partsSnap = await getDocs(collection(db, `events/${eventId}/participation`));
  return partsSnap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      name: coerceString(data.name ?? data.displayName ?? data.fullName ?? null) ?? undefined,
      status: (data.status as Participant['status']) ?? 'unknown',
      compensatedHours: typeof data.compensatedHours === 'number' ? data.compensatedHours : null,
      hourlyRateOverride: typeof data.hourlyRateOverride === 'number' ? data.hourlyRateOverride : null,
    } as Participant;
  });
};

/**
 * Fetch all events with their participation. Optionally filter by status.
 */
export const getEventsWithParticipation = async (
  opts?: { statusIn?: EventStatus[] }
): Promise<AdminEventWithTotals[]> => {
  const eventsCol = collection(db, 'events');
  // Sorting by date ascending; adjust to your needs
  const qy = query(eventsCol, orderBy('date', 'desc'));
  const evSnap = await getDocs(qy);

  const wanted = (opts?.statusIn && opts.statusIn.length) ? new Set(opts.statusIn) : null;

  const out: AdminEventWithTotals[] = [];
  for (const evDoc of evSnap.docs) {
    const data = evDoc.data();
    const status: EventStatus = (data.status as EventStatus) ?? 'draft';
    if (wanted && !wanted.has(status)) continue;

    const participants = await getParticipants(evDoc.id);

    const hourlyRate = coerceNumber(data.hourlyRate ?? data.rate ?? 0, 0);
    const duration = coerceNumber(
      data.eventDurationHours ?? data.durationHours ?? hoursBetween(data.startTime, data.endTime) ?? 0,
      0
    );

    // Compute per-performer payout only for those marked 'going'
    let headcountGoing = 0;
    let totalCompHours = 0;
    let totalPayout = 0;

    for (const p of participants) {
      if (p.status !== 'going') continue;
      headcountGoing += 1;
      const hrs = typeof p.compensatedHours === 'number' && p.compensatedHours >= 0 ? p.compensatedHours : duration;
      const rate = typeof p.hourlyRateOverride === 'number' && p.hourlyRateOverride >= 0 ? p.hourlyRateOverride : hourlyRate;
      const pay = coerceNumber(hrs, 0) * coerceNumber(rate, 0);
      totalCompHours += coerceNumber(hrs, 0);
      totalPayout += pay;
    }

    out.push({
      id: evDoc.id,
      title: coerceString(data.title, 'Untitled Event')!,
      date: (data.date as Timestamp) ?? null,
      startTime: coerceString(data.startTime ?? null),
      endTime: coerceString(data.endTime ?? null),
      eventDurationHours: duration || null,
      hourlyRate: hourlyRate || null,
      clientCharge: typeof data.clientCharge === 'number' ? data.clientCharge : null,
      status,
      venue: coerceString(data.venue ?? null),
      notes: coerceString(data.notes ?? null),
      participants,
      totals: { headcountGoing, totalCompHours, totalPayout },
    });
  }

  return out;
};

// ------------------------- Mutations -------------------------
export const setEventStatus = async (eventId: string, status: EventStatus) => {
  await updateDoc(doc(db, 'events', eventId), { status });
};

export const publishEvent = async (eventId: string) => setEventStatus(eventId, 'published');
export const hideEvent = async (eventId: string) => setEventStatus(eventId, 'hidden');
export const cancelEvent = async (eventId: string) => setEventStatus(eventId, 'canceled');

/** Delete event and all participation docs (client-side recursive delete) */
export const deleteEventWithParticipation = async (eventId: string) => {
  // Delete subcollection first
  const partsCol = collection(db, `events/${eventId}/participation`);
  const partsSnap = await getDocs(partsCol);
  for (const d of partsSnap.docs) {
    await deleteDoc(d.ref);
  }
  // Then delete the event itself
  await deleteDoc(doc(db, 'events', eventId));
};