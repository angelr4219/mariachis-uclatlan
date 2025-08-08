import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { EventType } from '../types/Event';

export function useEvents() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<EventType, 'id'>) }));
      setEvents(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { events, loading };
}