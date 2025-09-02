
// =============================================
// FILE: src/services/profile.ts
// Description: Profile types + Firestore read/write helpers
// Collection: profiles/{uid}
// =============================================
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type AppRole = 'admin' | 'performer' | 'guest';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  year?: string;
  major?: string;
  instrument?: string;
  instruments?: string[];
  section?: string; // e.g., Strings / Brass / Rhythm / Vocals
  bio?: string;
  roles?: AppRole[]; // default ['performer']
  returning?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COL = 'profiles';

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, COL, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
}

export async function upsertProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, COL, uid);
  const withTimestamps = {
    ...data,
    updatedAt: serverTimestamp(),
    createdAt: (data as any)?.createdAt ?? serverTimestamp(),
  };
  await setDoc(ref, withTimestamps, { merge: true });
}
