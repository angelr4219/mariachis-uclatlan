

// ==================================
// 4) HOOK — src/hooks/useEvents.ts
// ==================================
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import type { EventDoc, EventItem } from '../../types/events';
import { normalizeEvent } from '../../utils/events';


export function useEvents() {
const [events, setEvents] = useState<EventItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);


useEffect(() => {
const q = query(collection(db, 'events'), orderBy('start', 'asc'));
const unsub = onSnapshot(
q,
(snap) => {
const list: EventItem[] = snap.docs.map((d) =>
normalizeEvent({ id: d.id, ...(d.data() as Omit<EventDoc, 'id'>) })
);
setEvents(list);
setLoading(false);
},
(err) => {
console.error('[useEvents] onSnapshot error', err);
setError(err.message || 'Failed to load events');
setLoading(false);
}
);
return () => unsub();
}, []);


return { events, loading, error };
}

