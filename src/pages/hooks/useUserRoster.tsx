
// =============================================================
// FILE: src/pages/hooks/useUsersRoster.tsx
// Description: Load from /users respecting rules (admin: list; member: own doc)
// =============================================================
import React from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { listUsersAdmin, type UserProfile, coerceRoles } from '../../services/users';

const DEFAULTS: Omit<UserProfile, 'uid' | 'email'> = {
  name: '',
  phoneNumber: '',
  year: '',
  major: '',
  instrument: '',
  instruments: [],
  section: '',
  bio: '',
  roles: ['member'],
  returning: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  photoURL: '',
};

async function isAdminUser(): Promise<boolean> {
  const u = auth.currentUser;
  if (!u) return false;
  try {
    const tok = await u.getIdTokenResult();
    if (tok?.claims?.admin) return true;
  } catch {}
  try {
    const us = await getDoc(doc(db, 'users', u.uid));
    return !!us.exists() && !!(us.data() as any)?.isAdmin;
  } catch {}
  return false;
}

export function useUsersRoster() {
  const [profiles, setProfiles] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      const u = auth.currentUser;
      if (!u) {
        setError('Not signed in');
        setLoading(false);
        return;
      }
      try {
        const admin = await isAdminUser();
        if (admin) {
          const rows = await listUsersAdmin();
          const clean = rows.map((p) => ({
            ...DEFAULTS,
            ...p,
            uid: p.uid,
            email: p.email ?? '',
            roles: coerceRoles(p.roles as any),
            instruments: Array.isArray(p.instruments) ? p.instruments : [],
          }));
          if (mounted) setProfiles(clean);
        } else {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const data = snap.exists() ? (snap.data() as Partial<UserProfile>) : {};
          const mine: UserProfile = {
            ...DEFAULTS,
            ...(data as any),
            uid: u.uid,
            email: (data as any)?.email ?? u.email ?? '',
            roles: coerceRoles((data as any)?.roles),
            instruments: Array.isArray((data as any)?.instruments) ? (data as any)?.instruments : [],
          };
          if (mounted) setProfiles([mine]);
        }
      } catch (e: any) {
        console.error('[useUsersRoster] failed', e);
        if (mounted) setError(e?.message || 'Failed to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { profiles, loading, error } as const;
}

