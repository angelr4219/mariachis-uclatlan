// src/services/events.ts
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc , where, serverTimestamp} from 'firebase/firestore';
import { db } from '../firebase';
import type { EventDoc, EventItem, EventStatus } from '../types/events';
import type { RSVPDoc } from '../types/events'; // re-exported from types/events
import { normalizeEvent } from '../utils/events';
import type { RSVPStatus } from '../types/events'; // or from './events' if you re-export it


// Optional convenience so legacy imports work: `import { auth } from "../services/events"`
export { auth } from '../firebase';

const EVENTS = 'events';

// -----------------
// List subscribe
// -----------------
export function observeEvents(onNext: (events: EventItem[]) => void, onError?: (e: unknown) => void) {
  const q = query(collection(db, EVENTS), orderBy('start', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => normalizeEvent({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) } as EventDoc));
      onNext(list);
    },
    (err) => onError?.(err)
  );
}

// Back-compat helper used by AdminEvents
export function subscribeUpcomingEvents(statuses: EventStatus[] = ['draft', 'published'], onNext?: (rows: EventItem[]) => void) {
  const q = query(collection(db, EVENTS), orderBy('start', 'asc'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => normalizeEvent({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) } as EventDoc))
      .filter((e) => !statuses.length || statuses.includes(e.status));
    onNext?.(list);
  });
}

// -----------------
// Single doc subscribe
// -----------------
export function observeEvent(eventId: string, onNext: (event: EventItem | null) => void, onError?: (e: unknown) => void) {
  const ref = doc(db, EVENTS, eventId);
  return onSnapshot(
    ref,
    (snap) => {
      onNext(snap.exists() ? normalizeEvent({ id: snap.id, ...(snap.data() as Omit<EventDoc, 'id'>) } as EventDoc) : null);
    },
    (err) => onError?.(err)
  );
}

// -----------------
// Create / Update
// -----------------
export async function createEvent(payload: Omit<EventDoc, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, EVENTS), { ...payload, createdAt: Date.now(), updatedAt: Date.now() });
  await setDoc(ref, { id: ref.id }, { merge: true });
  return ref.id;
}

export async function updateEvent(eventId: string, patch: Partial<EventDoc>) {
  await updateDoc(doc(db, EVENTS, eventId), { ...patch, updatedAt: Date.now() });
}

// -----------------
// Publish / Cancel helpers
// -----------------
export async function publishEvent(eventId: string) {
  await updateEvent(eventId, { status: 'published', publishedAt: Date.now() } as Partial<EventDoc>);
}

export async function cancelEvent(eventId: string) {
  await updateEvent(eventId, { status: 'cancelled' } as Partial<EventDoc>);
}


// =======================
// RSVP helpers (#4)
// =======================

/**
 * Query events where this performer is assigned.
 * Requires EventDoc to have: assignedPerformerIds?: string[]
 */
export async function fetchAssignedEventsForUser(uid: string): Promise<EventItem[]> {
    const eventsRef = collection(db, EVENTS);
    const q = query(eventsRef, where('assignedPerformerIds', 'array-contains', uid), orderBy('start', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      normalizeEvent({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) } as EventDoc)
    );
  }
  
  /**
   * Write the current user's RSVP under: events/{eventId}/rsvps/{uid}
   */
  export async function respondToRSVP(eventId: string, uid: string, status: RSVPStatus): Promise<void> {
    const rsvpRef = doc(db, EVENTS, eventId, 'rsvps', uid);
    await setDoc(
      rsvpRef,
      { status, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
  
  // ---- RSVP single-user helpers ----

/**
 * Read the current user's RSVP for a given event.
 * Path: events/{eventId}/rsvps/{uid}
 */
export async function getMyRSVP(eventId: string, uid: string) {
    const ref = doc(db, 'events', eventId, 'rsvps', uid);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ uid, ...(snap.data() as any) }) : null;
    }
    
    
    export async function setRSVP(eventId: string, r: { uid: string; status: import('../types/events').RSVPStatus; displayName?: string | null; role?: string | null; }) {
    const ref = doc(db, 'events', eventId, 'rsvps', r.uid);
    await setDoc(
    ref,
    {
    uid: r.uid,
    displayName: r.displayName ?? null,
    role: r.role ?? null,
    status: r.status, // 'maybe' is the only tentative-like value we persist
    updatedAt: serverTimestamp(),
    },
    { merge: true }
    );
    }