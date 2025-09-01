// src/types/rsvp.ts
export type RSVPStatus = 'accepted' | 'declined' | 'tentative' | 'none';


export type RoleNeed = {
role: string; // e.g., "violin", "vihuela", "guitarrón", "trumpet", "guitarra", "harp"
count: number; // number of performers needed for this role
};


export interface RSVPDoc {
uid: string;
displayName?: string;
role?: string; // member's claimed/assigned role for this event
status: RSVPStatus; // accepted / declined / tentative / none
updatedAt: number; // Date.now()
}