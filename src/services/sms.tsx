
// =============================================
// FILE: src/services/sms.tsx (client helper to call the Function)
// =============================================
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export type ScheduleEventSmsInput = {
  eventId: string;
  uid: string;
  overridePhone?: string | null;
  trajePickupAt?: string | null; // ISO8601
};

export async function scheduleEventSms(payload: ScheduleEventSmsInput) {
  const callable = httpsCallable(functions, 'scheduleEventSms');
  return await callable(payload);
}
