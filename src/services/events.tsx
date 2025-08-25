

// ======================================
// 3) SERVICE — src/services/events.ts
// ======================================
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { EventDoc, EventItem } from '../types/events';
import { normalizeEvent } from '../utils/events';


export function observeEvents(
onNext: (events: EventItem[]) => void,
onError?: (err: unknown) => void
) {
const q = query(collection(db, 'events'), orderBy('start', 'asc'));
return onSnapshot(
q,
(snap) => {
const list = snap.docs.map((d) => normalizeEvent({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) }));
onNext(list);
},
(err) => onError?.(err)
);
}

