// =============================================
// FILE: src/services/polls.ts
// Purpose: Tiny Firestore helpers for member polls (Halloween 2025)
// =============================================
import { auth, db } from '../firebase';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  getDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

export type Interest = 'yes' | 'maybe' | 'no';

export type HalloweenSubmission = {
  interest: Interest;
  pledgeCents?: number; // store money in cents for safety
};

const POLL_COLLECTION = 'social_polls';
const POLL_ID = 'halloween2025';

/** Ensures the top-level poll doc exists so increments never fail. */
async function ensurePollDoc() {
  const pollRef = doc(db, POLL_COLLECTION, POLL_ID);
  const snap = await getDoc(pollRef);
  if (!snap.exists()) {
    await setDoc(pollRef, {
      title: 'Halloween Social 2025',
      createdAt: serverTimestamp(),
      // aggregate counters (kept denormalized for admin dashboard)
      counts: { yes: 0, maybe: 0, no: 0 },
      pledgesCentsTotal: 0,
      responses: 0,
    });
  }
  return pollRef;
}

/**
 * Write the current user's response to:
 *  social_polls/halloween2025/responses/{uid}
 * and maintain aggregate counters in social_polls/halloween2025
 */
export async function submitHalloweenResponse(input: HalloweenSubmission) {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in');

  const pollRef = await ensurePollDoc();
  const respRef = doc(db, `${POLL_COLLECTION}/${POLL_ID}/responses`, user.uid);

  // Normalize pledge
  const pledgeCents = Math.max(0, Math.round((input.pledgeCents ?? 0)));

  // Upsert the response document (user-scoped)
  await setDoc(
    respRef,
    {
      uid: user.uid,
      name: user.displayName ?? null,
      email: user.email ?? null,
      interest: input.interest,
      pledgeCents,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Bump aggregate counters. We need to know what the user previously had to adjust counts precisely.
  // Simpler approach: store the latest interest in the top-level doc keyed by uid (sparse), then adjust.
  const userMarker = doc(db, `${POLL_COLLECTION}/${POLL_ID}/markers`, user.uid);
  const prev = await getDoc(userMarker);
  const prevInterest = (prev.exists() ? (prev.data() as any).interest : null) as Interest | null;

  // Prepare delta increments
  const incYes = input.interest === 'yes' ? 1 : 0;
  const incMaybe = input.interest === 'maybe' ? 1 : 0;
  const incNo = input.interest === 'no' ? 1 : 0;

  const decYes = prevInterest === 'yes' ? -1 : 0;
  const decMaybe = prevInterest === 'maybe' ? -1 : 0;
  const decNo = prevInterest === 'no' ? -1 : 0;

  await setDoc(userMarker, { interest: input.interest, updatedAt: serverTimestamp() }, { merge: true });

  // Update aggregates in the parent doc
  await updateDoc(pollRef, {
    'counts.yes': increment(incYes + decYes),
    'counts.maybe': increment(incMaybe + decMaybe),
    'counts.no': increment(incNo + decNo),
    pledgesCentsTotal: increment(pledgeCents),
    responses: increment(prevInterest ? 0 : 1),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Realtime listener for the aggregate counts (for Admin views)
 */
export function onHalloweenCounts(cb: (data: {
  yes: number; maybe: number; no: number; responses: number; pledgesCentsTotal: number;
}) => void): Unsubscribe {
  const pollRef = doc(db, POLL_COLLECTION, POLL_ID);
  return onSnapshot(pollRef, (snap) => {
    const d = snap.data() as any;
    cb({
      yes: d?.counts?.yes ?? 0,
      maybe: d?.counts?.maybe ?? 0,
      no: d?.counts?.no ?? 0,
      responses: d?.responses ?? 0,
      pledgesCentsTotal: d?.pledgesCentsTotal ?? 0,
    });
  });
}
