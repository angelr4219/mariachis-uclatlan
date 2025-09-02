// =============================================
// FILE: src/services/inquiries.ts
// Desc: Firestore create function for public Hire Us inquiries
// =============================================
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type InquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  org?: string;
  message?: string;
  event?: {
    title?: string;
    date?: string;     // YYYY-MM-DD
    start?: string;    // ISO
    end?: string;      // ISO
    location?: string;
  };
  meta?: Record<string, unknown>; // extensible
};

export async function createInquiry(payload: InquiryPayload) {
  // Normalize: ensure at least a name/email
  if (!payload?.name || !payload?.email) {
    throw new Error('Missing name or email in inquiry');
  }

  const docData = {
    ...payload,
    status: 'new' as const,          // 'new' | 'in_progress' | 'closed'
    source: 'public_form' as const,  // trace where it came from
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'inquiries'), docData);
  return ref.id; // return new doc id for UI debugging if needed
}


