// src/adminComponents/AdminManageMembers.tsx
import React from 'react';
import { useProfiles } from '../pages/hooks/useProfiles.tsx';
import { updateUserRoles } from '../services/users';
import { primaryRole, type Role, type UserProfile } from '../types/user';
import RoleBadge from '../pages/admin/RoleBadge';
import RoleSelect from '../pages/admin/RoleSelect';


const AdminManageMembers: React.FC = () => {
const { profiles, loading, error } = useProfiles();
const [search, setSearch] = React.useState('');


const filtered = React.useMemo(() => {
const q = search.trim().toLowerCase();
if (!q) return profiles;
return profiles.filter(p =>
(p.name?.toLowerCase().includes(q)) ||
(p.email?.toLowerCase().includes(q)) ||
(p.instruments || []).join(', ').toLowerCase().includes(q)
);
}, [profiles, search]);


const setRole = async (p: UserProfile, r: Role) => {
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
{error && <p style={{ color: 'salmon' }}>{error}</p>}


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
const current = primaryRole(p.roles);
return (
<tr key={p.uid} style={{ borderTop: '1px solid #eee' }}>
<td>{p.name}</td>
<td>{p.email}</td>
<td>{(p.instruments || []).join(', ')}</td>
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