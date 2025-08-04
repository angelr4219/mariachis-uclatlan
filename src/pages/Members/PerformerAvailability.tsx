import React, { useState, useEffect, ChangeEvent } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, getDocs, DocumentData } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

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
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as EventData[];
      setEvents(eventsData);
    };

    fetchEvents();
  }, []);

  const handleAvailabilityChange = (eventId: string, status: string) => {
    setAvailability(prev => ({ ...prev, [eventId]: status }));
  };

  const handleSubmit = async (eventId: string) => {
    if (!user) return;
    const availabilityDocRef = doc(db, `events/${eventId}/availabilities/${user.uid}`);
    await setDoc(availabilityDocRef, {
      name: user.displayName || user.email,
      status: availability[eventId] || "maybe"
    });
    alert('Availability updated!');
  };

  if (!user) {
    return <p>Please log in to submit your availability.</p>;
  }

  return (
    <div>
      <h2>Your Availability</h2>
      {events.map(event => (
        <div key={event.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <h3>{event.title}</h3>
          <p>{event.date} at {event.location}</p>
          <select
            value={availability[event.id] || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleAvailabilityChange(event.id, e.target.value)}
          >
            <option value="">Select Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="maybe">Maybe</option>
          </select>
          <button onClick={() => handleSubmit(event.id)}>Submit</button>
        </div>
      ))}
    </div>
  );
};

export default PerformerAvailability;
