// =============================================
// FILE: src/services/roster.tsx (NEW)
// Desc: Load roster for an event from events/{eventId}/availability and enrich
//       with profile fields (displayName, section, instrument, hired)
// =============================================
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export type RosterStatus = 'yes' | 'maybe';
export type RosterEntry = {
  uid: string;
  status: RosterStatus;
  displayName: string;
  section?: string;
  instrument?: string;
  hired?: boolean;
};

function chunk<T>(arr: T[], n = 10): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** Load availability YES/MAYBE from the event subcollection, then fetch profiles. */
export async function loadRosterFromAvailability(eventId: string, includeMaybe = false): Promise<RosterEntry[]> {
  const statuses: RosterStatus[] = includeMaybe ? ['yes', 'maybe'] : ['yes'];

  // Prefer the authoritative path under the event
  const qAvail = query(
    collection(db, 'events', eventId, 'availability'),
    where('status', 'in', statuses as any)
  );
  const sAvail = await getDocs(qAvail);

  const byUid = new Map<string, RosterStatus>();
  sAvail.docs.forEach((d) => {
    const a = d.data() as any;
    if (statuses.includes(a.status)) byUid.set(d.id, a.status);
  });

  const uids = Array.from(byUid.keys());
  if (uids.length === 0) return [];

  // Fetch profiles in batches of 10
  const profiles: Record<string, any> = {};
  for (const ch of chunk(uids, 10)) {
    const qP = query(collection(db, 'profiles'), where('__name__', 'in', ch as any));
    const sP = await getDocs(qP);
    sP.docs.forEach((d) => (profiles[d.id] = d.data()));

    // optional fallback to users/* if profile missing
    const missing = ch.filter((id) => !profiles[id]);
    if (missing.length) {
      const qU = query(collection(db, 'users'), where('__name__', 'in', missing as any));
      const sU = await getDocs(qU);
      sU.docs.forEach((d) => (profiles[d.id] = { displayName: (d.data() as any).displayName, email: (d.data() as any).email }));
    }
  }

  const rows: RosterEntry[] = uids.map((uid) => {
    const p = profiles[uid] || {};
    const displayName = p.displayName || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown Member';
    return {
      uid,
      status: byUid.get(uid)! as RosterStatus,
      displayName,
      section: p.section,
      instrument: p.instrument,
      hired: p.hired,
    };
  });

  // sort: yes first, then section alpha, then name
  rows.sort((a, b) => (
    (a.status === 'yes' ? 0 : 1) - (b.status === 'yes' ? 0 : 1) ||
    (a.section || '').localeCompare(b.section || '') ||
    a.displayName.localeCompare(b.displayName)
  ));

  return rows;
}


