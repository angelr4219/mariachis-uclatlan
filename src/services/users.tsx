// =============================================
// FILE: src/services/users.ts
// Description: Safe helpers for user profiles to avoid accidental overwrites.
// - ensureUserProfile: create-if-missing with merge
// - updateUserRoles: updates only roles (merge)
// - patchUserProfile: partial updates with merge
// =============================================
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  email?: string | null;
  name?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  instruments?: string[];
  roles?: string[]; // e.g., ['member'] | ['performer'] | ['admin']
  createdAt?: any;
  updatedAt?: any;
};

/** Ensure there is a doc at users/{uid} without clobbering existing fields. */
export async function ensureUserProfile(uid?: string) {
  const u = uid || auth.currentUser?.uid;
  if (!u) return;
  const ref = doc(db, 'users', u);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const cu = auth.currentUser;
    await setDoc(ref, {
      uid: u,
      email: cu?.email ?? null,
      name: cu?.displayName ?? null,
      displayName: cu?.displayName ?? null,
      photoURL: cu?.photoURL ?? null,
      roles: ['member'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } else {
    // touch updatedAt without overwriting user data
    await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
  }
}

/** Update roles safely using merge so other fields are preserved. */
export async function updateUserRoles(uid: string, roles: string[]) {
  const ref = doc(db, 'users', uid);
  // Prefer updateDoc; if doc might be missing, fallback to setDoc({merge:true})
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { roles, updatedAt: serverTimestamp() });
  } else {
    await setDoc(ref, { uid, roles, updatedAt: serverTimestamp() }, { merge: true });
  }
}

/** Generic partial profile patch (merge true). */
export async function patchUserProfile(uid: string, patch: Partial<UserProfile>) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

