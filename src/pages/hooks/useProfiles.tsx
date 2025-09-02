// =============================================
// FILE: src/pages/hooks/useProfiles.tsx
// Description: Load roster from Firestore (/profiles) with safe defaults
// =============================================
import React from 'react';
import { collection, getDocs, type CollectionReference } from 'firebase/firestore';
import { db } from '../../firebase';
import type { UserProfile } from '../../services/profile';

const DEFAULT_PROFILE: Omit<UserProfile, 'uid' | 'email'> = {
  name: '',
  phoneNumber: '',
  year: '',
  major: '',
  instrument: '',
  instruments: [],
  section: '',
  bio: '',
  roles: ['performer'],
  returning: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  photoURL: '',
};

export function useProfiles() {
  const [profiles, setProfiles] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // NOTE: we store profiles under /profiles/{uid}
        const snap = await getDocs(collection(db, 'profiles') as CollectionReference);
        const rows = snap.docs.map((d) => {
          const data = d.data() as Partial<UserProfile>;
          return {
            uid: d.id,
            email: data.email ?? '',
            ...DEFAULT_PROFILE,
            ...data,
            // normalize roles/instruments in case an old doc is weird
            roles: Array.isArray(data.roles) && data.roles.length ? data.roles : ['performer'],
            instruments: Array.isArray(data.instruments) ? data.instruments : [],
          } as UserProfile;
        });
        setProfiles(rows);
      } catch (e: any) {
        console.error('[useProfiles] load failed:', e);
        setError(e?.message || 'Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return { profiles, loading, error } as const;
}
