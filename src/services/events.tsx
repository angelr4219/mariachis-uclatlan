// =============================================================
// FILE: src/services/events.tsx
// Purpose: Unified Events + Availability service (Web SDK v9)
// - Safe, typed helpers for create / update / delete / observe
// - RSVP & availability stored at: events/{eventId}/availability/{uid}
//   • mirrors to legacy rsvps/* and flat availability/events_{eventId}_{uid}
// - Uses serverTimestamp() for Firestore-friendly ordering and rules
// - Compatible with your existing normalizeEvent & EventDoc types
// =============================================================

import { db, auth } from '../firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  Timestamp,
  type CollectionReference,
  type FieldValue,
} from 'firebase/firestore';
import type { EventDoc, EventItem, EventStatus, RSVPStatus } from '../types/events';
import { normalizeEvent } from '../utils/events';

// Re-export so legacy imports keep working
export { auth };

const EVENTS = 'events';

// -----------------------------
// Types & Patch helpers
// -----------------------------
// Allow serverTimestamp() for publishedAt without fighting TS
export type EventPatch = Partial<Omit<EventDoc, 'publishedAt'>> & {
  publishedAt?: number | Timestamp | FieldValue;
};

// -----------------------------
// Observers / readers
// -----------------------------
export function observeEvents(
  onNext: (events: EventItem[]) => void,
  onError?: (e: unknown) => void
) {
  const qRef = query(collection(db, EVENTS), orderBy('start', 'asc'));
  return onSnapshot(
    qRef,
    (snap) => {
      const list = snap.docs.map((d) =>
        normalizeEvent({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) } as EventDoc)
      );
      onNext(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeUpcomingEvents(
  statuses: EventStatus[] = ['draft', 'published'],
  onNext?: (rows: EventItem[]) => void
) {
  const qRef = query(collection(db, EVENTS), orderBy('start', 'asc'));
  return onSnapshot(qRef, (snap) => {
    const list = snap.docs
      .map((d) => normalizeEvent({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) } as EventDoc))
      .filter((e) => !statuses.length || statuses.includes(e.status));
    onNext?.(list);
  });
}

export function observeEvent(
  eventId: string,
  onNext: (event: EventItem | null) => void,
  onError?: (e: unknown) => void
) {
  const ref = doc(db, EVENTS, eventId);
  return onSnapshot(
    ref,
    (snap) => {
      onNext(
        snap.exists()
          ? normalizeEvent({ id: snap.id, ...(snap.data() as Omit<EventDoc, 'id'>) } as EventDoc)
          : null
      );
    },
    (err) => onError?.(err)
  );
}

export async function getEvent(eventId: string): Promise<EventItem | null> {
  const ref = doc(db, EVENTS, eventId);
  const snap = await getDoc(ref);
  return snap.exists()
    ? normalizeEvent({ id: snap.id, ...(snap.data() as Omit<EventDoc, 'id'>) } as EventDoc)
    : null;
}

export async function listEvents(): Promise<EventItem[]> {
  const colRef = collection(db, EVENTS);
  const snap = await getDocs(query(colRef, orderBy('start', 'asc')));
  return snap.docs.map((d) =>
    normalizeEvent({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) } as EventDoc)
  );
}

// -----------------------------
// Mutations (create / update / delete / publish / cancel)
// -----------------------------
export async function createEvent(payload: {
  title: string;
  date: string; // YYYY-MM-DD (kept for utils/formatDateRange)
  startTime?: string | null;
  endTime?: string | null;
  location?: string;
  description?: string;
  status: 'draft' | 'published' | 'cancelled';
}) {
  return addDoc(collection(db, EVENTS), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEvent(eventId: string, patch: EventPatch) {
  await updateDoc(doc(db, EVENTS, eventId), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteEvent(eventId: string) {
  await deleteDoc(doc(db, EVENTS, eventId));
}

export async function publishEvent(eventId: string) {
  const patch: EventPatch = { status: 'published', publishedAt: serverTimestamp() };
  await updateEvent(eventId, patch);
}

export async function cancelEvent(eventId: string) {
  await updateEvent(eventId, { status: 'cancelled' });
}

// -----------------------------
// Assignments
// -----------------------------
/**
 * Fetch events where a performer is assigned.
 * Requires EventDoc to have: assignedPerformerIds?: string[]
 */
export async function fetchAssignedEventsForUser(uid: string): Promise<EventItem[]> {
  const eventsRef = collection(db, EVENTS) as CollectionReference;
  const qRef = query(
    eventsRef,
    where('assignedPerformerIds', 'array-contains', uid),
    orderBy('start', 'asc')
  ) as any;
  const snap = await getDocs(qRef);
  return snap.docs.map((d) =>
    normalizeEvent({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) } as EventDoc)
  );
}

// -----------------------------
// Availability + RSVP (authoritative path + mirrors)
// -----------------------------
const availabilityDocRef = (eventId: string, uid: string) => doc(db, EVENTS, eventId, 'availability', uid);
const legacyRsvpDocRef = (eventId: string, uid: string) => doc(db, EVENTS, eventId, 'rsvps', uid); // optional legacy mirror

export async function getMyRSVP(eventId: string, uid: string) {
  // Prefer availability
  const ref = availabilityDocRef(eventId, uid);
  let snap = await getDoc(ref);
  if (snap.exists()) return { uid, ...(snap.data() as any) };

  // Fallback to legacy rsvps for older data
  const legacy = await getDoc(legacyRsvpDocRef(eventId, uid));
  return legacy.exists() ? { uid, ...(legacy.data() as any) } : null;
}

export async function setRSVP(
  eventId: string,
  r: { uid: string; status: RSVPStatus; displayName?: string | null; role?: string | null }
) {
  const payload = {
    uid: r.uid,
    displayName: r.displayName ?? null,
    role: r.role ?? null,
    status: r.status, // 'yes' | 'maybe' | 'no'
    updatedAt: serverTimestamp(),
    finalized: false,
    finalizedBy: null,
    finalizedAt: null,
  } as const;

  // Authoritative
  await setDoc(availabilityDocRef(eventId, r.uid), payload, { merge: true });

  // Legacy mirror
  await setDoc(legacyRsvpDocRef(eventId, r.uid), { status: r.status, updatedAt: serverTimestamp() }, { merge: true });

  // Flat mirror for reporting
  await setDoc(doc(db, 'availability', `events_${eventId}_${r.uid}`), {
    ...payload,
    source: 'events',
    refId: eventId,
    eventId,
  }, { merge: true });
}

export async function respondToRSVP(eventId: string, uid: string, status: RSVPStatus) {
  await setRSVP(eventId, { uid, status });
}

export async function finalizeAvailability(
  eventId: string,
  uid: string,
  finalized: boolean,
  by: string | null = 'admin'
) {
  const patch = {
    finalized,
    finalizedBy: finalized ? by : null,
    finalizedAt: finalized ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  } as const;

  await updateDoc(availabilityDocRef(eventId, uid), patch as any);
  await setDoc(doc(db, 'availability', `events_${eventId}_${uid}`), {
    ...patch,
    source: 'events',
    refId: eventId,
    eventId,
  }, { merge: true });
}

// -----------------------------
// Small utils
// -----------------------------
export const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
};
