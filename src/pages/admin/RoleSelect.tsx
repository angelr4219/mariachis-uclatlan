

// ------------------------------------------------------------
// src/components/admin/RoleSelect.tsx
import React from 'react';
import type { Role } from '../../types/user';


interface Props {
value: Role;
onChange: (r: Role) => void;
disabled?: boolean;
}


const RoleSelect: React.FC<Props> = ({ value, onChange, disabled }) => {
return (
<select
value={value}
onChange={(e) => onChange(e.target.value as Role)}
disabled={disabled}
style={{ padding: '6px 8px' }}
>
<option value="member">Member</option>
<option value="performer">Performer</option>
<option value="admin">Admin</option>
</select>
);
};


export default RoleSelect;