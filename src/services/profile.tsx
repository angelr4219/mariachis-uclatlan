// src/services/profile.ts
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from '../types/user';


/**
* Create/update a user profile at `profiles/{uid}`.
* - Ensures `uid` is set on the doc
* - Sets `createdAt` if missing; always updates `updatedAt`
*/
export async function upsertProfile(uid: string, profile: Partial<UserProfile>) {
const ref = doc(db, 'profiles', uid);
const now = serverTimestamp();
await setDoc(
ref,
{
uid,
...profile,
createdAt: (profile as any)?.createdAt ?? now,
updatedAt: now,
},
{ merge: true }
);
}