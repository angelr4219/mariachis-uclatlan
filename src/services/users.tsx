

// ------------------------------------------------------------
// src/services/users.ts
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Role } from '../types/user';


/**
* Updates the roles array on a user's profile document.
* Assumes profiles are stored at `profiles/{uid}`.
*/
export async function updateUserRoles(uid: string, roles: Role[]) {
const ref = doc(db, 'profiles', uid);
const snap = await getDoc(ref);
if (snap.exists()) {
await updateDoc(ref, { roles });
} else {
// Create if missing (guards older accounts)
await setDoc(ref, { roles }, { merge: true });
}
}