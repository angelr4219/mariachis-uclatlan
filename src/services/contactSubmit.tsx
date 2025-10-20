// =============================================
// FILE: src/services/contactSubmit.tsx (UPDATED)
// Fix: never send undefined to Firestore; coerce optional fields to null or omit.
// =============================================
// Consolidate imports to avoid duplicates

import {
addDoc,
collection,
doc,
updateDoc,
serverTimestamp,
Timestamp,
} from 'firebase/firestore';
  import { db } from '../firebase';

export type ContactSubmitInput = {
  name: string;
  email: string;
  phone: string | null;
  org?: string | null;         // <-- optional
  eventTitle: string;
  details: string;
  dateISO: string;      // YYYY-MM-DD
  startTime: string;    // HH:MM (24h)
  endTime: string;      // HH:MM (24h)
  startISO: string;     // `${dateISO}T${startTime}:00`
  endISO: string;       // `${dateISO}T${endTime}:00`
  durationMinutes: number; // computed in UI
  source: 'contactForm' | string;
};

const toTs = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isFinite(d.getTime()) ? Timestamp.fromDate(d) : null;
};

export const submitContactInquiry = async (input: ContactSubmitInput): Promise<{ inquiryId: string; eventId: string; }> => {
  const startTs = toTs(input.startISO);
  const endTs = toTs(input.endISO);

  // ---- Build inquiry payload; NEVER use undefined ----
  const inquiryPayload: Record<string, any> = {
    kind: 'performanceInquiry' as const,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    eventTitle: input.eventTitle,
    eventDate: input.dateISO,
    startTime: input.startTime,
    endTime: input.endTime,
    durationMinutes: input.durationMinutes,
    details: input.details,
    createdAt: serverTimestamp(),
    source: input.source,
  };
  // only attach org if present (avoid undefined)
  if (input.org && input.org.trim()) {
    inquiryPayload.org = input.org.trim();
  } else {
    inquiryPayload.org = null; // or omit entirely if you prefer: just remove this line
  }

  const inquiryRef = await addDoc(collection(db, 'inquiries'), inquiryPayload);

  // ---- Create linked Event draft (ensure start/end timestamps exist) ----
  const eventPayload = {
    title: input.eventTitle,
    start: startTs,
    end: endTs,
    location: '',
    description: `Auto-created from contact form inquiry ${inquiryRef.id}.` + (input.details ? `\n\nDetails:\n${input.details}` : ''),
    status: 'requested' as const,
    client: { name: input.name, email: input.email, phone: input.phone ?? null },
    inquiryId: inquiryRef.id,
    createdAt: serverTimestamp(),
    createdBy: 'public',
    durationMinutes: input.durationMinutes,
  };
  const eventRef = await addDoc(collection(db, 'events'), eventPayload);

  await updateDoc(doc(db, 'inquiries', inquiryRef.id), { eventId: eventRef.id });

  return { inquiryId: inquiryRef.id, eventId: eventRef.id };
};

