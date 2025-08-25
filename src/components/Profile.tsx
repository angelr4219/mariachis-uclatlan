
// ---------------------------------------------
// File: src/services/profile.ts
// ---------------------------------------------
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from './User';


/**
* Read a user's profile document from Firestore (collection: users/uid).
*/
export async function readProfile(uid: string): Promise<UserProfile | null> {
const ref = doc(db, 'users', uid);
const snap = await getDoc(ref);
return snap.exists() ? (snap.data() as UserProfile) : null;
}


/**
* Upsert (create or merge) a user profile, always stamping updatedAt.
* Pass createdAt for first-write scenarios; Firestore merge keeps prior values otherwise.
*/
export async function upsertProfile(uid: string, data: Partial<UserProfile>) {
const ref = doc(db, 'users', uid);
await setDoc(
ref,
{ ...data, updatedAt: serverTimestamp() },
{ merge: true }
);
}

