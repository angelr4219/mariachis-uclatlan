// =============================================
// FILE: src/services/inquiries.ts
// Purpose: Backend logic to fetch inquiries within a date range + who said YES
// Firestore structure (recommended):
//   inquiries/{inquiryId} {
//     title: string,
//     date: Timestamp,
//     clientName?: string,
//     status?: 'Submitted'|'Accepted'|'Booked'|'Completed'|'Cancelled',
//     location?: string,
//     ...
//   }
//   inquiries/{inquiryId}/responses/{userId} {
//     userId: string,
//     name: string,            // denormalized for quick reporting (optional)
//     response: 'yes'|'no'|'maybe',
//     updatedAt: Timestamp,
//   }
// If you instead store availability under events, we can adapt: swap collection names accordingly.
// =============================================
import { collection, getDocs, query, where, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type YesResponse = {
  userId: string;
  name?: string;
  updatedAt?: Date;
};

export type InquiryRecord = {
  id: string;
  title: string;
  date: Date | null;     // JS Date for UI
  status?: string;
  clientName?: string;
  location?: string;
  yesCount: number;
  yesList: YesResponse[]; // people who said yes
};

export type DateRange = { start?: Date | null; end?: Date | null };

// Pull inquiries in date range, plus YES responses per inquiry
export async function fetchInquiriesWithYes(range: DateRange): Promise<InquiryRecord[]> {
  const inquiriesCol = collection(db, 'inquiries');

  // Build a date range query on Timestamp field 'date'
  const constraints: any[] = [];
  if (range.start) constraints.push(where('date', '>=', Timestamp.fromDate(atStartOfDay(range.start))));
  if (range.end)   constraints.push(where('date', '<=', Timestamp.fromDate(atEndOfDay(range.end))));
  constraints.push(orderBy('date', 'asc'));

  const qInquiries = query(inquiriesCol, ...constraints);
  const snap = await getDocs(qInquiries);

  const results: InquiryRecord[] = [];

  for (const d of snap.docs) {
    const data = d.data() as any;
    const date = data?.date?.toDate?.() ?? (data?.date ? new Date(data.date) : null);

    // Pull YES responses from subcollection 'responses'
    const responsesCol = collection(db, `inquiries/${d.id}/responses`);
    const qYes = query(responsesCol, where('response', '==', 'yes'));
    const yesSnap = await getDocs(qYes);

    const yesList: YesResponse[] = yesSnap.docs.map((r) => {
      const rd = r.data() as any;
      return {
        userId: rd?.userId ?? r.id,
        name: rd?.name,
        updatedAt: rd?.updatedAt?.toDate?.() ?? (rd?.updatedAt ? new Date(rd.updatedAt) : undefined),
      };
    });

    results.push({
      id: d.id,
      title: data?.title ?? '(untitled inquiry)',
      date,
      status: data?.status,
      clientName: data?.clientName,
      location: data?.location,
      yesCount: yesList.length,
      yesList,
    });
  }

  return results;
}

function atStartOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function atEndOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// Optional helper: fetch display names if responses don't store `name`
export async function hydrateNamesFromUsers(inquiries: InquiryRecord[]): Promise<InquiryRecord[]> {
  // Build a set of missing userIds
  const missing = new Set<string>();
  for (const iq of inquiries) {
    for (const y of iq.yesList) {
      if (!y.name && y.userId) missing.add(y.userId);
    }
  }
  const idToName = new Map<string, string>();

  // Pull from users collection
  for (const uid of missing) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const u = userDoc.data() as any;
      idToName.set(uid, u?.name || u?.displayName || '(no name)');
    }
  }

  // Apply
  for (const iq of inquiries) {
    iq.yesList = iq.yesList.map((y) => ({
      ...y,
      name: y.name || (y.userId ? idToName.get(y.userId) : undefined),
    }));
  }

  return inquiries;
}

