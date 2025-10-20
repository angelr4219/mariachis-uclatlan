import { db, auth } from '../firebase';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  onSnapshot, orderBy, query, setDoc, updateDoc,
  where, serverTimestamp, Timestamp, type Unsubscribe
} from 'firebase/firestore';
import type { EventDoc, EventItem, EventStatus, RSVPStatus, RSVPDoc } from '../types/events';
import { normalizeEvent } from '../utils/events';

export { auth };

// --- helpers to build Firestore Timestamps from date/time strings
function toStartEnd(date?: string | null, startTime?: string | null, endTime?: string | null) {
  const mk = (t?: string | null) => (date ? `${date}T${(t ?? '00:00')}:00` : null);
  const sIso = mk(startTime);
  const eIso = mk(endTime);
  const toTs = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return isFinite(d.getTime()) ? Timestamp.fromDate(d) : null;
  };
  return { start: toTs(sIso), end: toTs(eIso) };
}

// --------- READS (normalized) ----------
export function observeEvents(
  onNext: (events: EventItem[]) => void,
  onError?: (e: unknown) => void
): Unsubscribe {
  const qRef = query(collection(db, 'events'), orderBy('start', 'asc'));
  return onSnapshot(
    qRef,
    (snap) => {
      const list = snap.docs.map((d) => normalizeEvent({ id: d.id, ...(d.data() as any) }));
      onNext(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeUpcomingEvents(
  statuses: EventStatus[] = ['draft', 'published'],
  onNext?: (rows: EventItem[]) => void
): Unsubscribe {
  const qRef = query(collection(db, 'events'), orderBy('start', 'asc'));
  return onSnapshot(qRef, (snap) => {
    const list = snap.docs
      .map((d) => normalizeEvent({ id: d.id, ...(d.data() as any) }))
      .filter((e) => (e.start != null) && (!statuses.length || statuses.includes(e.status)));
    onNext?.(list);
  });
}

// ---------- WRITES ----------
export async function createEvent(input: {
  title: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string;
  description?: string;
  status?: EventStatus;
}) {
  const { start, end } = toStartEnd(input.date ?? null, input.startTime ?? null, input.endTime ?? null);
  const payload = {
    title: input.title.trim(),
    start: start ?? null,
    end: end ?? null,
    location: input.location?.trim() || '',
    description: input.description?.trim() || '',
    status: input.status ?? 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(collection(db, 'events'), payload);
}

export async function updateEvent(eventId: string, patch: any) {
  // If someone sends date/startTime/endTime, recompute canonical start/end.
  let extra: any = {};
  if ('date' in patch || 'startTime' in patch || 'endTime' in patch) {
    const { start, end } = toStartEnd(patch.date ?? null, patch.startTime ?? null, patch.endTime ?? null);
    extra = { start: start ?? null, end: end ?? null };
  }
  const clean = { ...patch };
  delete clean.date; delete clean.startTime; delete clean.endTime;

  await updateDoc(doc(db, 'events', eventId), {
    ...clean,
    ...extra,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(eventId: string) {
  await deleteDoc(doc(db, 'events', eventId));
}

export async function publishEvent(eventId: string) {
  await updateEvent(eventId, { status: 'published', publishedAt: serverTimestamp() });
}

export async function cancelEvent(eventId: string) {
  await updateEvent(eventId, { status: 'cancelled' });
}

// (keep your RSVP helpers as-is)
// ---------- RSVP (availability-backed) ----------
const availabilityRef = (eventId: string, uid: string) =>
  doc(db, 'events', eventId, 'availability', uid);
const legacyRsvpRef = (eventId: string, uid: string) =>
  doc(db, 'events', eventId, 'rsvps', uid); // optional, status-only mirror
const flatAvailabilityRef = (eventId: string, uid: string) =>
  doc(db, 'availability', `events_${eventId}_${uid}`);

/**
 * Read the current user's RSVP for an event.
 * Prefers events/{eventId}/availability/{uid}; falls back to legacy/flat mirrors.
 */
export async function getMyRSVP(eventId: string, userId: string): Promise<RSVPDoc | null> {
  // 1) Canonical availability path
  const aSnap = await getDoc(availabilityRef(eventId, userId));
  if (aSnap.exists()) {
    const a = aSnap.data() as any;
    return {
      uid: userId,
      displayName: a.displayName ?? undefined,
      role: a.role ?? undefined,
      status: a.status,
      updatedAt: a.updatedAt,
    };
  }

  // 2) Legacy rsvps path (status-only)
  const lSnap = await getDoc(legacyRsvpRef(eventId, userId));
  if (lSnap.exists()) {
    const l = lSnap.data() as any;
    return {
      uid: userId,
      status: l.status ?? 'unanswered',
      updatedAt: l.updatedAt,
    };
  }

  // 3) Flat mirror (if present)
  const fSnap = await getDoc(flatAvailabilityRef(eventId, userId));
  if (fSnap.exists()) {
    const f = fSnap.data() as any;
    return {
      uid: userId,
      displayName: f.displayName ?? undefined,
      role: f.role ?? undefined,
      status: f.status ?? 'unanswered',
      updatedAt: f.updatedAt,
    };
  }

  return null;
}

/**
 * Set/merge the RSVP for a user on an event.
 * Writes:
 *  - events/{eventId}/availability/{uid} (authoritative)
 *  - events/{eventId}/rsvps/{uid} (legacy mirror: status only)
 *  - availability/events_{eventId}_{uid} (flat mirror)
 */
export async function setRSVP(eventId: string, rsvpDoc: RSVPDoc): Promise<void> {
  const { uid, displayName, role, status } = rsvpDoc;

  const canonicalPayload = {
    uid,
    displayName: displayName ?? null,
    role: role ?? null,
    status,                         // 'yes' | 'maybe' | 'no' | 'unanswered'
    updatedAt: serverTimestamp(),
    // finalize fields kept for admin workflow; harmless to include here
    finalized: false,
    finalizedBy: null,
    finalizedAt: null,
  };

  // 1) Authoritative availability subcollection (merge so we don’t clobber other fields)
  await setDoc(availabilityRef(eventId, uid), canonicalPayload, { merge: true });

  // 2) Legacy mirror (status-only)
  await setDoc(legacyRsvpRef(eventId, uid), {
    status,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 3) Flat mirror for reporting
  await setDoc(flatAvailabilityRef(eventId, uid), {
    ...canonicalPayload,
    source: 'events',
    refId: eventId,
    eventId,
  }, { merge: true });
}
