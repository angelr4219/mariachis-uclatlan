

// ------------------------------------------------------------
// src/components/admin/RoleBadge.tsx
import React from 'react';
import type { Role } from '../../types/user';


const COLORS: Record<Role, string> = {
member: '#e2e8f0', // slate-200
performer: '#cffafe', // cyan-100
admin: '#fde68a', // amber-200
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