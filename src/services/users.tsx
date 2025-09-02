// =============================================================
// FILE: src/services/users.tsx
// Description: unified UserProfile type + admin-friendly read/write helpers for /users
// =============================================================
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Role } from '../types/user';

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  year?: string;
  major?: string;
  instrument?: string;
  instruments?: string[];
  section?: string;
  bio?: string;
  roles?: Role[] | string[]; // Firestore may store strings; we coerce in code
  returning?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  photoURL?: string;
  isAdmin?: boolean; // derived from roles when we update
  createdAt?: any;
  updatedAt?: any;
}

export function coerceRoles(r?: string[] | Role[] | null): Role[] {
  const allowed: Role[] = ['admin', 'performer', 'member'];
  if (!r) return [];
  const arr = Array.isArray(r) ? r : [r as any];
  return arr
    .map((x) => (typeof x === 'string' ? (x as string).toLowerCase() : x))
    .filter((x): x is Role => allowed.includes(x as Role));
}

const COL = 'users';

export async function getUser(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, COL, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserProfile>;
  return {
    uid,
    email: data.email ?? '',
    ...data,
  } as UserProfile;
}

// Admin list (requires Firestore rule that allows list for isAdmin())
export async function listUsersAdmin(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => {
    const data = d.data() as Partial<UserProfile>;
    return {
      uid: d.id,
      email: data.email ?? '',
      ...data,
    } as UserProfile;
  });
}

export async function updateUserRoles(uid: string, roles: Role[]): Promise<void> {
  const ref = doc(db, COL, uid);
  await setDoc(
    ref,
    {
      roles,
      isAdmin: roles.includes('admin'),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
