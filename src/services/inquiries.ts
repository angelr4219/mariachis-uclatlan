// =============================================
// FILE: src/pages/services/inquiries.ts  (NEW or UPDATE existing)
// Purpose: normalized creator that always writes to `inquiries` with admin-review defaults
// =============================================
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type PublicInquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  org?: string;
  message?: string;
  event?: { title?: string; date?: string; start?: string; end?: string; location?: string };
  meta?: { userAgent?: string; tz?: string };
};

export async function createInquiry(p: PublicInquiryPayload) {
  const payload = {
    name: p.name,
    email: p.email,
    phone: p.phone ?? null,
    org: p.org ?? null,
    message: p.message ?? null,
    event: {
      title: p.event?.title ?? null,
      date: p.event?.date ?? null,
      start: p.event?.start ?? null,
      end: p.event?.end ?? null,
      location: p.event?.location ?? null,
    },
    status: 'new',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    meta: { userAgent: p.meta?.userAgent ?? null, tz: p.meta?.tz ?? null },
  } as const;

  await addDoc(collection(db, 'inquiries'), payload);
}
