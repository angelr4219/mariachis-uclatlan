import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function createCalendarItemForInquiry(input: {
  title: string;
  date?: string;   // YYYY-MM-DD or ISO
  start?: string;  // ISO
  end?: string;    // ISO
  location?: string;
  status?: 'new' | 'in_progress' | 'closed';
  sourceId?: string; // inquiry doc id
}) {
  const docData = {
    type: 'inquiry' as const,
    title: input.title,
    date: input.date ?? undefined,
    start: input.start ?? undefined,
    end: input.end ?? undefined,
    location: input.location ?? undefined,
    status: input.status ?? 'new',
    sourceId: input.sourceId ?? undefined,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'calendar_feed'), docData);
  return ref.id;
}

