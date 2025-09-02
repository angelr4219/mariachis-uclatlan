
// =============================================
// FILE: src/services/publicClient.tsx
// Description: Submit client booking/inquiry to Firestore (and optional Apps Script webhook)
// Collections used: clients (primary). Optionally creates a lightweight events draft.
// =============================================
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

type EventLite = {
  title?: string;
  date?: string; // YYYY-MM-DD
  start?: string | undefined; // ISO
  end?: string | undefined;   // ISO
  location?: string;
};

export type ClientRequest = {
  recaptchaToken?: string;
  name: string;
  email: string;
  phone?: string;
  org?: string;
  message?: string;
  event?: EventLite;
};

export async function submitClientRequest(payload: ClientRequest): Promise<{ id: string }> {
  // minimal frontend validation
  if (!payload?.name || !payload?.email) {
    throw new Error('Name and email are required');
  }

  const docBody = {
    type: 'client_request',
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    org: payload.org ?? null,
    message: payload.message ?? null,
    event: payload.event ?? null,
    recaptchaToken: payload.recaptchaToken ?? null,
    status: 'new', // new | triaged | scheduled | closed
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Primary write: /clients
  const ref = await addDoc(collection(db, 'clients'), docBody);

  // Optional: create a light draft in /events for admins to see in calendars
  try {
    if (payload.event && (payload.event.title || payload.event.date)) {
      await addDoc(collection(db, 'events'), {
        title: payload.event.title || 'Client Inquiry',
        date: payload.event.date ?? null,
        start: payload.event.start ?? null,
        end: payload.event.end ?? null,
        location: payload.event.location ?? null,
        status: 'inquiry', // distinguish from published events
        visibility: 'private',
        source: 'client_form',
        clientRef: ref.path,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (e) {
    // Non-fatal; continue even if event draft fails
    console.warn('[submitClientRequest] event draft create failed:', e);
  }

  // Optional: Forward to Apps Script webhook if configured
  const url = (import.meta as any).env?.VITE_APPS_SCRIPT_URL as string | undefined;
  if (url) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...docBody, firestoreId: ref.id }),
      });
    } catch (e) {
      console.warn('[submitClientRequest] webhook failed:', e);
    }
  }

  return { id: ref.id };
}

