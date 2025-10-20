// src/types/eventCardVM.ts
import type { EventStatus } from './events';

export interface EventCardVM {
  id: string;
  title: string;
  date: string;      // e.g., "Sep 2, 2025"
  time: string;      // e.g., "3:00 PM – 4:30 PM"
  location: string;
  description: string;
  status: EventStatus;
}
