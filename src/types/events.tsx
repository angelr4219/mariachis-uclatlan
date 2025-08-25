// ===============================
// 1) TYPES — src/types/events.ts
// ===============================
import type { Timestamp } from 'firebase/firestore';


export type EventStatus = 'draft' | 'published' | 'cancelled';


// Firestore document shape (as stored)
export interface EventDoc {
id: string; // convenience when mapping
title: string;
start: Timestamp; // Firestore Timestamp
end?: Timestamp; // optional
location?: string;
description?: string;
status?: EventStatus;
}


// Normalized for app usage (Dates for UI logic)
export interface EventItem {
id: string;
title: string;
start: Date;
end?: Date;
location?: string;
description?: string;
status?: EventStatus;
}


// View model for EventCard (stringified date/time)
export interface EventCardVM {
id: string;
title: string;
date: string; // e.g., "Sep 2, 2025"
time: string; // e.g., "3:00 PM – 5:00 PM"
location: string;
description: string;
status?: EventStatus;
}

