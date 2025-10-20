

// =============================================
// PATCH 2 — src/types/events.ts (align RSVPStatus used by availability/roster)
// If your app elsewhere expects 'yes' | 'maybe' | 'no', keep that here to prevent type/runtime mismatches.
// =============================================
import type { Timestamp } from 'firebase/firestore';
import type { RoleNeed } from './rsvp';
export type { RoleNeed } from './rsvp';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'internal' | 'requested';

export interface ClientInfo {
  name?: string;
  email?: string;
  phone?: string;
  org?: string;
  notes?: string;
}

export interface EventDoc {
  id: string;
  title: string;
  start: Timestamp | null;
  end?: Timestamp | null;
  location: string;
  description?: string;
  status: EventStatus;
  rolesNeeded?: RoleNeed[];
  assignedUids?: string[];
  client?: ClientInfo | null;
  createdBy?: string;
  createdAt?: number | Timestamp;
  updatedAt?: number | Timestamp;
  publishedAt?: number | Timestamp;
}

export interface EventItem {
  id: string;
  title: string;
  start: Date | null;
  end?: Date | null;
  location: string;
  description?: string;
  status: EventStatus;
  rolesNeeded?: RoleNeed[];
  assignedUids?: string[];
  client?: ClientInfo | null;
  createdBy?: string;
  createdAt?: number | Date;
  updatedAt?: number | Date;
  publishedAt?: number | Date;
}

export type RSVPStatus = 'yes' | 'maybe' | 'no' | 'unanswered';

export interface RSVPDoc {
  uid: string;
  displayName?: string | null;
  role?: string | null;
  status: RSVPStatus;
  updatedAt?: any; // Firestore Timestamp (or number)
}
