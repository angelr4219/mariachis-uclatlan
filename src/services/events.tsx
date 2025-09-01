// src/services/events.ts
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { EventDoc, EventItem, EventStatus } from '../types/events';
import type { RSVPDoc } from '../types/events'; // re-exported from types/events
import { normalizeEvent } from '../utils/events';

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

// -----------------
// RSVP subcollection
// -----------------
function rsvpsCol(eventId: string) {
  return collection(db, EVENTS, eventId, 'rsvps');
}

export function observeRsvps(eventId: string, onNext: (rows: RSVPDoc[]) => void, onError?: (e: unknown) => void) {
  return onSnapshot(
    rsvpsCol(eventId),
    (snap) => onNext(snap.docs.map((d) => d.data() as RSVPDoc)),
    (err) => onError?.(err)
  );
}

export async function getMyRSVP(eventId: string, uid: string): Promise<RSVPDoc | null> {
  const snap = await getDoc(doc(rsvpsCol(eventId), uid));
  return snap.exists() ? (snap.data() as RSVPDoc) : null;
}

export async function setRSVP(eventId: string, rsvp: RSVPDoc) {
  await setDoc(doc(rsvpsCol(eventId), rsvp.uid), { ...rsvp, updatedAt: Date.now() }, { merge: true });
}
