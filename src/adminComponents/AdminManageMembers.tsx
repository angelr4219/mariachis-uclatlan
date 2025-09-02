// =============================================================
// FILE: src/adminComponents/AdminManageMembers.tsx
// Purpose: Fix TS mismatches by (1) unifying on services/users profile type,
// (2) coercing string[] roles -> Role[], and (3) null-safe fields.
// =============================================================
import React from 'react';
import { useProfiles } from '../pages/hooks/useProfiles';
import { updateUserRoles } from '../services/users';
import RoleBadge from '../pages/admin/RoleBadge';
import RoleSelect from '../pages/admin/RoleSelect';

// Import Role + primaryRole utilities, but avoid importing UserProfile from ../types/user
// to prevent cross-module type incompatibilities.
import { primaryRole, type Role } from '../types/user';

// Derive the profile type from the hook to match its source of truth.
// This avoids the services vs types/UserProfile name/type collision.
export type Profile = ReturnType<typeof useProfiles>['profiles'][number];

// Helper: coerce whatever comes from Firestore (string[] | undefined) into Role[]
function coerceRoles(r?: string[] | Role[] | null): Role[] {
  if (!r) return [];
  const asArray = Array.isArray(r) ? r : [r as any];
  const allowed: Role[] = ['admin', 'performer', 'member'];
  return asArray
    .map((x) => (typeof x === 'string' ? x.toLowerCase() : x))
    .filter((x): x is Role => allowed.includes(x as Role));
}

const AdminManageMembers: React.FC = () => {
  const { profiles, loading, error } = useProfiles();
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => {
      const name = (p.name ?? '').toLowerCase();
      const email = (p.email ?? '').toLowerCase();
      const instruments = (p.instruments ?? []).join(', ').toLowerCase();
      return name.includes(q) || email.includes(q) || instruments.includes(q);
    });
  }, [profiles, search]);

  const setRole = async (p: Profile, r: Role) => {
    const roles: Role[] = r === 'admin' ? ['admin'] : r === 'performer' ? ['performer'] : ['member'];
    await updateUserRoles(p.uid, roles);
  };

  return (
    <section className="ucla-content" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1 className="ucla-heading-xl">Manage Members</h1>
      <p>Search, view, and assign roles.</p>

      <div style={{ margin: '12px 0' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, instrument…"
          style={{ width: '100%', maxWidth: 420 }}
        />
      </div>

      {loading && <p>Loading members…</p>}
      {error && <p style={{ color: 'salmon' }}>{String(error)}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th>Name</th>
            <th>Email</th>
            <th>Instruments</th>
            <th>Role</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => {
            const roles = coerceRoles(p.roles as any); // Firestore often stores string[]
            const current = primaryRole(roles);
            return (
              <tr key={p.uid} style={{ borderTop: '1px solid #eee' }}>
                <td>{p.name ?? ''}</td>
                <td>{p.email ?? ''}</td>
                <td>{(p.instruments ?? []).join(', ')}</td>
                <td><RoleBadge role={current} /></td>
                <td>
                  <RoleSelect value={current} onChange={(r) => setRole(p, r)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default AdminManageMembers;
