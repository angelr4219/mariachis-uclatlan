// src/hooks/useProfiles.ts — corrected import paths + small polish
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase'; 
import type { UserProfile } from '../../types/user'; 

/**
 * Subscribes to user profiles. Primary: `profiles` (ordered by name).
 * If empty or missing (legacy), falls back to `users`.
 */
export function useProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubPrimary: (() => void) | null = null;
    let unsubFallback: (() => void) | null = null;

    try {
      const qPrimary = query(collection(db, 'profiles'), orderBy('name'));
      unsubPrimary = onSnapshot(
        qPrimary,
        (snap) => {
          const rows = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
          if (rows.length > 0) {
            setProfiles(rows as UserProfile[]);
            setLoading(false);
          } else {
            // Fallback to legacy `users` collection
            const qFallback = query(collection(db, 'users'));
            unsubFallback = onSnapshot(
              qFallback,
              (s2) => {
                const rows2 = s2.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
                setProfiles(rows2 as UserProfile[]);
                setLoading(false);
              },
              (err) => {
                console.error('[useProfiles fallback]', err);
                setError(err.message || 'Failed to load profiles');
                setLoading(false);
              }
            );
          }
        },
        (err) => {
          console.error('[useProfiles primary]', err);
          setError(err.message || 'Failed to load profiles');
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.error('[useProfiles setup]', err);
      setError(err.message || 'Failed to subscribe');
      setLoading(false);
    }

    return () => {
      try { unsubPrimary && unsubPrimary(); } catch {}
      try { unsubFallback && unsubFallback(); } catch {}
    };
  }, []);

  return { profiles, loading, error };
}
