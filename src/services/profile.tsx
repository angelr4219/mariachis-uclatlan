// ---------------------------------------------
// FILE: src/services/profile.ts
// Purpose: Make sure every signed-in user has a profile in Firestore.
// - Auto-create on sign-in (attachProfileBootstrap)
// - Read / observe / update helpers
// - Normalizes fields used by roster (displayName, section, instrument, hired)
// ---------------------------------------------
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
  serverTimestamp, type Unsubscribe
} from 'firebase/firestore';

export type Role = 'admin' | 'performer' | 'member' | 'staff';

export type UserProfile = {
  uid: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;

  // Roster fields
  instrument?: string;
  section?: string;     // e.g. Violins, Trumpets, Vocals
  hired?: boolean;      // admin-set

  // Extra
  roles?: Role[];       // default ['member','performer']
  bio?: string;
  photoURL?: string;

  createdAt?: any;
  updatedAt?: any;
};

const DEFAULT_ROLES: Role[] = ['member', 'performer'];

/** Normalize and fill safe defaults */
function normalizeProfile(uid: string, src: Partial<UserProfile>): UserProfile {
  return {
    uid,
    displayName: src.displayName ?? '',
    firstName: src.firstName ?? '',
    lastName: src.lastName ?? '',
    email: src.email ?? '',
    phoneNumber: src.phoneNumber ?? '',
    instrument: src.instrument ?? '',
    section: src.section ?? '',
    hired: src.hired ?? false,
    roles: Array.isArray(src.roles) && src.roles.length ? (src.roles as Role[]) : DEFAULT_ROLES,
    bio: src.bio ?? '',
    photoURL: src.photoURL ?? '',
    createdAt: (src as any)?.createdAt,
    updatedAt: (src as any)?.updatedAt,
  };
}

/** Create/merge minimal profile for a Firebase User */
export async function ensureProfileForUser(user: User) {
  const ref = doc(db, 'profiles', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || (user.email?.split('@')[0] ?? 'Member'),
      email: user.email ?? '',
      photoURL: user.photoURL ?? '',
      roles: DEFAULT_ROLES,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Light touch: keep name/photo fresh, don’t overwrite admin-edited fields
    const data = snap.data() as Partial<UserProfile>;
    const maybe: Partial<UserProfile> = {};
    if (!data.displayName && user.displayName) maybe.displayName = user.displayName;
    if (!data.email && user.email) maybe.email = user.email;
    if (!data.photoURL && user.photoURL) maybe.photoURL = user.photoURL;
    if (Object.keys(maybe).length) {
      maybe.updatedAt = serverTimestamp();
      await updateDoc(ref, maybe as any);
    }
  }
}

/** Attach at app boot to guarantee profiles/{uid} exists for all users */
export function attachProfileBootstrap(customAuth = auth): Unsubscribe {
  return onAuthStateChanged(customAuth, async (u) => {
    if (u) {
      try { await ensureProfileForUser(u); } catch (e) { /* non-fatal */ }
    }
  });
}

/** Read current profile */
export async function getMyProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'profiles', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? normalizeProfile(uid, snap.data() as Partial<UserProfile>) : null;
}

/** Live profile subscription */
export function observeMyProfile(uid: string, cb: (p: UserProfile | null) => void): Unsubscribe {
  const ref = doc(db, 'profiles', uid);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? normalizeProfile(uid, snap.data() as Partial<UserProfile>) : null);
  });
}

/** Update allowed fields (member self-edit) */
export async function updateMyProfile(
  uid: string,
  patch: Partial<Pick<UserProfile,
    'displayName'|'firstName'|'lastName'|'email'|'phoneNumber'|
    'instrument'|'section'|'bio'|'photoURL'
  >>
) {
  const ref = doc(db, 'profiles', uid);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() } as any);
}

/** Admin-only: toggle hired or roles, etc. */
export async function adminUpdateProfile(
  uid: string,
  patch: Partial<Pick<UserProfile,'hired'|'roles'|'instrument'|'section'>>
) {
  const ref = doc(db, 'profiles', uid);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() } as any);
}
