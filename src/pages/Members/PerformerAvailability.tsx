// File: src/pages/Members/PerformerAvailability.tsx
import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../../firebase';

interface EventData {
  id: string;
  title: string;
  date: string;
  location: string;
}

const PerformerAvailability: React.FC = () => {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState<EventData[]>([]);
  const [availability, setAvailability] = useState<{ [eventId: string]: string }>({});

  useEffect(() => {
    const fetchEvents = async () => {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as EventData[];
      setEvents(eventsData);
    };

    fetchEvents();
  }, []);

  const handleAvailabilityChange = (eventId: string, e: ChangeEvent<HTMLSelectElement>) => {
    setAvailability({ ...availability, [eventId]: e.target.value });
  };

  const handleSubmit = async (eventId: string) => {
    if (!user) return;

    const participationRef = doc(db, `events/${eventId}/participation/${user.uid}`);
    await setDoc(participationRef, {
      availability: availability[eventId] || 'Unavailable',
      updatedAt: new Date().toISOString(),
    });
    alert('Availability updated!');
  };

  return (
    <div>
      <h1>Set Your Availability</h1>
      {events.map((event) => (
        <div key={event.id}>
          <h3>{event.title}</h3>
          <p>{event.date} — {event.location}</p>
          <select
            value={availability[event.id] || ''}
            onChange={(e) => handleAvailabilityChange(event.id, e)}
          >
            <option value="">Select Availability</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
            <option value="Maybe">Maybe</option>
          </select>
          <button onClick={() => handleSubmit(event.id)}>Submit</button>
        </div>
      ))}
    </div>
  );
};

export default PerformerAvailability;
