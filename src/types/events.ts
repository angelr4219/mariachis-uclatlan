// ===============================
// 1) TYPES — src/types/events.ts
// ===============================# Calendar + RSVP + Sheet Sync + Client Booking (React + Vite + Firebase)

// src/types/events.ts
// Types for Events with Firestore Timestamp storage and Date-based UI model
// src/types/events.ts
// Types for Events with Firestore Timestamp storage and Date-based UI model

import type { Timestamp } from 'firebase/firestore';
import type { RoleNeed } from './rsvp';
export type { RoleNeed } from './rsvp';

export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface ClientInfo {
  name?: string;
  email?: string;
  phone?: string;
  org?: string;
  notes?: string;
}

// Firestore document shape (as stored)
export interface EventDoc {
  id: string; // convenience when mapping
  title: string;
  start: Timestamp; // Firestore Timestamp
  end?: Timestamp; // optional
  location: string;
  description?: string;
  status: EventStatus;

  // Extended fields already used elsewhere in the app
  rolesNeeded: RoleNeed[]; // what parts we need
  assignedUids?: string[]; // optional: seed who is assigned
  client?: ClientInfo | null; // client payload from the inquiry form

  createdBy: string; // uid or email
  createdAt: number; // Date.now()
  updatedAt: number; // Date.now()
  publishedAt?: number; // Date.now() when status becomes 'published'
}

// Normalized for app usage (Dates for UI logic)
export interface EventItem {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  location: string;
  description?: string;
  status: EventStatus;

  rolesNeeded: RoleNeed[];
  assignedUids?: string[];
  client?: ClientInfo | null;

  createdBy: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

// Optional: View model for presentational cards
export interface EventCardVM {
  id: string;
  title: string;
  date: string; // e.g., "Sep 2, 2025"
  time: string; // e.g., "3:00 PM – 5:00 PM"
  location: string;
  description: string;
  status: EventStatus;
}

export type RSVPStatus = 'accepted' | 'declined' | 'tentative' | 'none';



export interface RSVPDoc {
uid: string;
displayName?: string | null;
role?: string | null;
status: RSVPStatus; // 'accepted' | 'declined' | 'maybe'
updatedAt?: any; // Firestore Timestamp (or number if you store ms)
}