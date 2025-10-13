// ---------------------------------------------
// FILE: src/services/profile.ts
// ---------------------------------------------
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type Role = 'admin' | 'performer' | 'member';

export type UserProfile = {
  uid: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  year?: string;
  major?: string;

  // Instruments
  instrument?: string;       // legacy single
  instruments?: string[];    // preferred multi
  section?: string;

  // Bio
  bio?: string;

  // Membership / eligibility
  roles?: Role[];
  returning?: string;        // 'yes' | 'no' | ''
  ownsInstrument?: string;   // optional legacy
  readsMusic?: string;       // optional legacy

  // Emergency contact
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;

  // Media
  photoURL?: string;

  // Timestamps
  createdAt?: any;
  updatedAt?: any;
};

function normalizeProfile(uid: string, data: Partial<UserProfile>): UserProfile {
  return {
    uid,
    name: data.name ?? '',
    email: data.email ?? '',
    phoneNumber: data.phoneNumber ?? '',
    year: data.year ?? '',
    major: data.major ?? '',

    instrument: data.instrument ?? '',
    instruments: Array.isArray(data.instruments) ? data.instruments : [],
    section: data.section ?? '',

    bio: data.bio ?? '',

    roles: Array.isArray(data.roles) && data.roles.length
      ? (data.roles as Role[])
      : (['performer'] as Role[]), // default

    returning: data.returning ?? '',
    ownsInstrument: data.ownsInstrument ?? '',
    readsMusic: data.readsMusic ?? '',

    emergencyName: data.emergencyName ?? '',
    emergencyPhone: data.emergencyPhone ?? '',
    emergencyRelation: data.emergencyRelation ?? '',

    photoURL: data.photoURL ?? '',

    createdAt: (data as any).createdAt,
    updatedAt: (data as any).updatedAt,
  };
}

/** Read a user's profile document from Firestore (collection: users/{uid}). */
export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return normalizeProfile(uid, snap.data() as Partial<UserProfile>);
}

/**
 * Upsert (create or merge) a user profile, stamping updatedAt.
 * If createdAt is missing we seed it (first write).
 * NOTE: We only overwrite roles if caller provides an array.
 */
export async function upsertProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid);

  const payload: Partial<UserProfile> = {
    uid,
    ...patch,

    // Only set roles if provided & valid array; otherwise leave unchanged
    ...(Array.isArray(patch.roles) ? { roles: patch.roles as Role[] } : {}),

    // Timestamps
    updatedAt: serverTimestamp(),
    ...(patch && !(patch as any).createdAt ? { createdAt: serverTimestamp() } : {}),
  };

  await setDoc(ref, payload, { merge: true });
}
