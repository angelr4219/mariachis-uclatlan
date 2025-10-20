// =============================================
// FILE: src/services/availability.tsx (NEW)
// Desc: Client-only helpers to write availability and keep per-event roster in sync
// - submitAvailability: writes BOTH mirrors
//     1) events/{eventId}/availability/{uid}    (scoped to event)
//     2) availability/{flatId}                  (optional top-level mirror; keep if you already have data/queries)
//   Then rebuilds events/{eventId}/roster_members/* + roster_summary/latest on the client (no Cloud Functions).
// =============================================
import {
    collection, doc, setDoc, writeBatch, getDocs, query, where,
    serverTimestamp, getDoc
  } from 'firebase/firestore';
  import { db } from '../firebase';
  
  export type AvailabilityStatus = 'yes' | 'maybe' | 'no' | 'unanswered';
  
  export async function submitAvailability(opts: {
    eventId: string;
    uid: string;
    status: AvailabilityStatus;
    // You can pass additional RSVP fields here if you track them
  }): Promise<void> {
    const { eventId, uid, status } = opts;
  
    // 1) Write event-scoped availability
    const evAvailRef = doc(db, 'events', eventId, 'availability', uid);
    await setDoc(evAvailRef, {
      uid,
      eventId,
      status,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  
    // 2) OPTIONAL: Keep your existing top-level mirror (if you still use it elsewhere)
    //    If you want to remove the top-level mirror entirely, you can delete this block
    const flatId = `${eventId}__${uid}`; // any stable id scheme
    const flatRef = doc(db, 'availability', flatId);
    await setDoc(flatRef, {
      uid,
      eventId,
      status,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  
    // 3) Rebuild the roster for this event from its *event-scoped* availability
    await rebuildEventRoster(eventId);
  }
  
  // =============================================
  // Build and persist the roster under events/{eventId}/roster_members/* + roster_summary/latest
  // =============================================
  export async function rebuildEventRoster(eventId: string, includeMaybe = true): Promise<void> {
    const statuses = includeMaybe ? ['yes', 'maybe'] : ['yes'];
  
    // a) read event-scoped availability
    const qAvail = query(
      collection(db, 'events', eventId, 'availability'),
      where('status', 'in', statuses as any)
    );
    const sAvail = await getDocs(qAvail);
    const byUid = new Map<string, 'yes'|'maybe'>();
    sAvail.docs.forEach((d) => {
      const a = d.data() as any;
      if (a?.uid) byUid.set(a.uid, a.status);
    });
  
    const uids = Array.from(byUid.keys());
  
    // b) read profiles
    const profiles: Record<string, any> = {};
    const chunk = <T,>(arr: T[], n = 10) => arr.reduce<T[][]>((acc, _, i) => (i % n ? acc : [...acc, arr.slice(i, i + n)]), []);
    for (const ch of chunk(uids, 10)) {
      const snaps = await Promise.all(ch.map((uid) => getDoc(doc(db, 'profiles', uid))));
      snaps.forEach((p) => { if (p.exists()) profiles[p.id] = p.data(); });
    }
  
    // c) construct roster rows
    const rows = uids.map((uid) => {
      const p = profiles[uid] || {};
      const displayName = p.displayName || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown Member';
      return {
        uid,
        displayName,
        section: p.section || null,
        instrument: p.instrument || null,
        status: byUid.get(uid),
        hired: p.hired ?? null,
        updatedAt: serverTimestamp(),
      };
    });
  
    rows.sort((a, b) => (a.status === 'yes' ? 0 : 1) - (b.status === 'yes' ? 0 : 1)
      || (a.section || '').localeCompare(b.section || '')
      || a.displayName.localeCompare(b.displayName));
  
    // d) write roster_members + summary
    const batch = writeBatch(db);
  
    // delete removed members first: fetch current
    const currentSnap = await getDocs(collection(db, 'events', eventId, 'roster_members'));
    const keep = new Set(rows.map((r) => r.uid));
    currentSnap.forEach((docSnap) => {
      if (!keep.has(docSnap.id)) {
        batch.delete(doc(db, 'events', eventId, 'roster_members', docSnap.id));
      }
    });
  
    rows.forEach((r) => {
      batch.set(doc(db, 'events', eventId, 'roster_members', r.uid), r, { merge: true });
    });
  
    const yesCount = rows.filter((r) => r.status === 'yes').length;
    const maybeCount = rows.filter((r) => r.status === 'maybe').length;
    batch.set(doc(db, 'events', eventId, 'roster_summary', 'latest'), {
      count: rows.length,
      yesCount,
      maybeCount,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  
    await batch.commit();
  }
  