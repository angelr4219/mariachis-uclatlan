// src/types/user.ts
export type Role = 'member' | 'performer' | 'admin';


export interface UserProfile {
uid: string;
name?: string;
email?: string;
instruments?: string[];
roles?: Role[]; // optional for backward-compat
}


export function primaryRole(roles?: Role[]): Role {
if (!roles || roles.length === 0) return 'member';
// Priority: admin > performer > member
if (roles.includes('admin')) return 'admin';
if (roles.includes('performer')) return 'performer';
return 'member';
}