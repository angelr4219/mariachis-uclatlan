// src/services/refs.ts
import { db } from '../firebase';
import { doc, collection } from 'firebase/firestore';

export const eventAvailabilityDoc = (eventId: string, uid: string) => {
  if (!eventId) throw new Error('eventAvailabilityDoc: missing eventId');
  if (!uid) throw new Error('eventAvailabilityDoc: missing uid');
  return doc(db, 'events', eventId, 'availability', uid);
};
export const eventAvailabilityCol = (eventId: string) => {
  if (!eventId) throw new Error('eventAvailabilityCol: missing eventId');
  return collection(db, 'events', eventId, 'availability');
};
export const flatAvailabilityDoc = (eventId: string, uid: string) =>
  doc(db, 'availability', `${eventId}_${uid}`);
export const flatResponsesDoc = (eventId: string, uid: string) =>
  doc(db, 'availability_responses', `${eventId}_${uid}`);
