// =============================================
// FILE: src/services/participants.ts
// Purpose: Fetch + subscribe to event participants across multiple subcollection names
// Notes: uses correct Firebase types (DocumentData, Unsubscribe) and no unused imports
// =============================================
import {
    collection,
    getDocs,
    onSnapshot,
    type DocumentData,
    type Unsubscribe,
    Timestamp,
  } from 'firebase/firestore';
  import { db } from '../firebase';
  
  export type ParticipantInfo = {
    uid: string;
    name?: string;
    status?: 'going' | 'maybe' | 'declined' | 'unknown';
    section?: string;
    updatedAt?: Date; // for tie-breaking when merging
  };
  
  // Try these subcollection names under events/{eventId}/
  const CANDIDATE_SUBCOLLECTIONS = [
    'participation',
    'availability',
    'avaiablity', // misspelling kept for backward compatibility
    'rsvps',
    'rsvp',
  ] as const;
  
  // ---------- helpers ----------
  function toDateMaybe(x: unknown): Date | undefined {
    if (!x) return undefined;
    if (x instanceof Timestamp) return x.toDate();
    // @ts-ignore - guard for objects with toDate
    if (typeof x === 'object' && x && 'toDate' in (x as any)) return (x as any).toDate();
    const d = new Date(x as any);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  
  function normalizeStatus(v: unknown): ParticipantInfo['status'] {
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      if (['going', 'yes', 'attending', 'available', 'confirm', 'confirmed'].includes(s)) return 'going';
      if (['maybe', 'tentative', 'unsure'].includes(s)) return 'maybe';
      if (['declined', 'no', 'unavailable', 'cant', "can't", 'cannot'].includes(s)) return 'declined';
    }
    if (typeof v === 'boolean') return v ? 'going' : 'declined';
    return 'unknown';
  }
  
  function mapDocToParticipant(docId: string, data: DocumentData): ParticipantInfo {
    const uid: string = (data.uid as string) || docId;
    const name: string | undefined = (data.name as string) || (data.displayName as string);
    const section: string | undefined = (data.section as string) || (data.instrument as string);
  
    const rawStatus =
      data.status ??
      data.availability ??
      data.response ??
      data.rsvp ??
      data.going; // some schemas use boolean
  
    const status = normalizeStatus(rawStatus);
  
    const updatedAt =
      toDateMaybe((data as any).updatedAt) ||
      toDateMaybe((data as any).updated_at) ||
      toDateMaybe((data as any).lastUpdated) ||
      toDateMaybe((data as any)._updated) ||
      undefined;
  
    return { uid, name, status, section, updatedAt };
  }
  
  function chooseBetter(a?: ParticipantInfo, b?: ParticipantInfo): ParticipantInfo | undefined {
    if (!a) return b;
    if (!b) return a;
    if (a.updatedAt && b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
    if (a.updatedAt && !b.updatedAt) return a;
    if (!a.updatedAt && b.updatedAt) return b;
    const rank: Record<NonNullable<ParticipantInfo['status']>, number> = { going: 3, maybe: 2, declined: 1, unknown: 0 };
    const ra = rank[a.status ?? 'unknown'];
    const rb = rank[b.status ?? 'unknown'];
    if (ra !== rb) return ra > rb ? a : b;
    return b; // stable-ish fallback
  }
  
  function mergeByUid(lists: ParticipantInfo[][]): ParticipantInfo[] {
    const byUid = new Map<string, ParticipantInfo>();
    for (const list of lists) {
      for (const p of list) {
        byUid.set(p.uid, chooseBetter(byUid.get(p.uid), p)!);
      }
    }
    return Array.from(byUid.values());
  }
  
  // ---------- PUBLIC API ----------
  export async function fetchEventParticipants(eventId: string): Promise<ParticipantInfo[]> {
    const all: ParticipantInfo[][] = [];
    for (const sub of CANDIDATE_SUBCOLLECTIONS) {
      try {
        const snap = await getDocs(collection(db, `events/${eventId}/${sub}`));
        if (!snap.empty) all.push(snap.docs.map((d) => mapDocToParticipant(d.id, d.data())));
      } catch {
        // ignore; subcollection may not exist
      }
    }
    return mergeByUid(all);
  }
  
  export function subscribeEventParticipants(eventId: string, cb: (list: ParticipantInfo[]) => void): Unsubscribe {
    const unsubs: Unsubscribe[] = [];
    const latestBySub = new Map<string, ParticipantInfo[]>();
  
    const emit = () => cb(mergeByUid(Array.from(latestBySub.values())));
  
    for (const sub of CANDIDATE_SUBCOLLECTIONS) {
      try {
        const ref = collection(db, `events/${eventId}/${sub}`);
        const unsub = onSnapshot(ref, (snap) => {
          const arr = snap.docs.map((d) => mapDocToParticipant(d.id, d.data()));
          latestBySub.set(sub, arr);
          emit();
        }, () => {
          latestBySub.delete(sub);
          emit();
        });
        unsubs.push(unsub);
      } catch {
        // ignore
      }
    }
  
    return () => {
      for (const u of unsubs) {
        try { u(); } catch { /* noop */ }
      }
    };
  }
  
  // Convenience adapters for CalendarApp props
  export const fetchParticipantsProp = (eventId: string) => fetchEventParticipants(eventId);
  export const subscribeParticipantsProp = (eventId: string, cb: (list: ParticipantInfo[]) => void) =>
    subscribeEventParticipants(eventId, cb);
  