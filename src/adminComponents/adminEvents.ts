
// =============================================
// FILE: src/services/adminEvents.ts
// Purpose: Firestore helpers for Admin Events + Participation aggregation
// =============================================
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export type EventStatus = 'draft' | 'published' | 'hidden' | 'canceled';

export type Participant = {
  uid: string;
  name?: string;
  status?: 'going' | 'maybe' | 'declined' | 'unknown';
  compensatedHours?: number; // optional override
  hourlyRateOverride?: number; // optional override
};

export type AdminEvent = {
  id: string;
  title: string;
  date?: Timestamp | null;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  status: EventStatus;
  hourlyRate?: number | null;
  eventDurationHours?: number | null;
  clientCharge?: number | null;
};

export type AdminEventWithTotals = AdminEvent & {
  participants: Participant[];
  totals: {
    headcountGoing: number;
    totalCompHours: number;
    totalPayout: number;
  };
};

// ---------- Public API ----------
export async function getEventsWithParticipation(opts?: { statusIn?: EventStatus[] }): Promise<AdminEventWithTotals[]> {
  const eventsRef = collection(db, 'events');
  const constraints = [orderBy('date', 'desc')];
  if (opts?.statusIn && opts.statusIn.length) {
    // Firestore `in` supports up to 10 values
    // @ts-expect-error - stacking where with orderBy is fine if index exists
    constraints.unshift(where('status', 'in', opts.statusIn));
  }

  const qEv = query(eventsRef, ...constraints);
  const snap = await getDocs(qEv);

  const results: AdminEventWithTotals[] = [];
  for (const d of snap.docs) {
    const base = { id: d.id, ...(d.data() as any) } as AdminEvent;
    const partsRef = collection(db, `events/${d.id}/participation`);
    const partsSnap = await getDocs(partsRef);

    const participants: Participant[] = partsSnap.docs.map((x) => ({ uid: x.id, ...(x.data() as any) }));

    // Aggregations
    let headcountGoing = 0;
    let totalCompHours = 0;
    let totalPayout = 0;

    for (const p of participants) {
      const isGoing = p.status === 'going';
      if (!isGoing) continue;
      headcountGoing += 1;

      const hours = (typeof p.compensatedHours === 'number' ? p.compensatedHours : (base.eventDurationHours ?? 0));
      const rate = (typeof p.hourlyRateOverride === 'number' ? p.hourlyRateOverride : (base.hourlyRate ?? 0));

      totalCompHours += hours;
      totalPayout += hours * rate;
    }

    results.push({
      ...base,
      participants,
      totals: {
        headcountGoing,
        totalCompHours,
        totalPayout,
      },
    });
  }

  return results;
}

export async function publishEvent(eventId: string) {
  await updateDoc(doc(db, 'events', eventId), { status: 'published' satisfies EventStatus });
}
export async function hideEvent(eventId: string) {
  await updateDoc(doc(db, 'events', eventId), { status: 'hidden' satisfies EventStatus });
}
export async function cancelEvent(eventId: string) {
  await updateDoc(doc(db, 'events', eventId), { status: 'canceled' satisfies EventStatus });
}

export async function deleteEventWithParticipation(eventId: string) {
  const batch = writeBatch(db);
  const evRef = doc(db, 'events', eventId);

  // Delete all participation docs first
  const partsRef = collection(db, `events/${eventId}/participation`);
  const partsSnap = await getDocs(partsRef);
  partsSnap.forEach((p) => batch.delete(p.ref));

  // Delete the event doc
  batch.delete(evRef);

  await batch.commit();
}
