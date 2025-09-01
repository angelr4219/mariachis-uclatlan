// =============================================================
// FILE: src/components/admin/RoleBadge.tsx (unchanged; path canonicalized)
// =============================================================
import React from 'react';
import type { Role } from '../../types/user';

const COLORS: Record<Role, string> = {
  member: '#e2e8f0',
  performer: '#cffafe',
  admin: '#fde68a',
};

const TEXT: Record<Role, string> = {
  member: 'Member',
  performer: 'Performer',
  admin: 'Admin',
};

const RoleBadge: React.FC<{ role: Role }> = ({ role }) => (
  <span
    style={{
      background: COLORS[role],
      borderRadius: 9999,
      padding: '2px 10px',
      fontSize: 12,
      border: '1px solid rgba(0,0,0,0.06)'
    }}
  >
    {TEXT[role]}
  </span>
);

export default RoleBadge;
