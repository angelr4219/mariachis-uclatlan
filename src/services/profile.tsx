// src/services/profile.ts
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
  } from 'firebase/firestore';
  import { db } from '../firebase';
  
  export type Role = 'admin' | 'performer' | 'member';
  
  export type UserProfile = {
    uid: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    year?: string;
    major?: string;
    instrument?: string;
    instruments?: string[];
    section?: string;
    bio?: string;
    roles?: Role[];
    returning?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    photoURL?: string;
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
      roles: (Array.isArray(data.roles) ? data.roles : ['performer']) as Role[],
      returning: data.returning ?? '',
      
      photoURL: data.photoURL ?? '',
      createdAt: (data as any).createdAt,
      updatedAt: (data as any).updatedAt,
    };
  }
  
  export async function getProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return normalizeProfile(uid, snap.data() as Partial<UserProfile>);
  }
  
  export async function upsertProfile(
    uid: string,
    patch: Partial<UserProfile>
  ): Promise<void> {
    const ref = doc(db, 'users', uid);
    const payload: Partial<UserProfile> = {
      ...patch,
      uid,
      // only set roles if caller provided a valid array; otherwise leave unchanged
      ...(Array.isArray(patch.roles) ? { roles: patch.roles as Role[] } : {}),
      updatedAt: serverTimestamp(),
      // seed createdAt if not present
      ...(patch && !(patch as any).createdAt ? { createdAt: serverTimestamp() } : {}),
    };
    await setDoc(ref, payload, { merge: true });
  }
  