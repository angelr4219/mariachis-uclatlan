import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import type { DocumentData } from 'firebase/firestore'; // <-- ADD THIS LINE
import { db } from '../../firebase';
import { collection, doc, getDocs, setDoc} from 'firebase/firestore';

// Interfaces
interface EventData {
  id: string;
  title: string;
  date: string;
  location: string;
}

interface AvailabilityData {
  id: string;
  name: string;
  status: string;
}

const AdminEventAvailabilityPanel: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [availabilities, setAvailabilities] = useState<{ [eventId: string]: AvailabilityData[] }>({});

  // Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventsData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as DocumentData;
        return {
          id: docSnap.id,
          title: data.title,
          date: data.date,
          location: data.location
        };
      });
      setEvents(eventsData);
    };

    fetchEvents();
  }, []);

  // Fetch Availabilities for a given Event
  const fetchAvailabilities = async (eventId: string) => {
    const subCollectionRef = collection(db, `events/${eventId}/availabilities`);
    const querySnapshot = await getDocs(subCollectionRef);
    const availabilityData = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as DocumentData;
      return {
        id: docSnap.id,
        name: data.name,
        status: data.status
      };
    });
    setAvailabilities(prev => ({ ...prev, [eventId]: availabilityData }));
  };

  const handleStatusChange = (eventId: string, userId: string, status: string) => {
    setAvailabilities(prev => ({
      ...prev,
      [eventId]: prev[eventId].map(a =>
        a.id === userId ? { ...a, status } : a
      )
    }));
  };

  const handleSubmit = async (eventId: string, userId: string) => {
    const performer = availabilities[eventId].find(a => a.id === userId);
    if (!performer) return;
    const availabilityDocRef = doc(db, `events/${eventId}/availabilities/${userId}`);
    await setDoc(availabilityDocRef, {
      name: performer.name,
      status: performer.status
    });
    alert(`Updated availability for ${performer.name}`);
  };

  return (
    <div>
      <h2>Admin Event Availability Panel</h2>
      {events.map(event => (
        <div key={event.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <h3>{event.title}</h3>
          <p>{event.date} at {event.location}</p>
          <button onClick={() => fetchAvailabilities(event.id)}>Load Availabilities</button>

          {availabilities[event.id] && (
            <table border={1} cellPadding={8} style={{ marginTop: '1rem', width: '100%' }}>
              <thead>
                <tr>
                  <th>Performer</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {availabilities[event.id].map(performer => (
                  <tr key={performer.id}>
                    <td>{performer.name}</td>
                    <td>
                      <select
                        value={performer.status}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleStatusChange(event.id, performer.id, e.target.value)
                        }
                      >
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                        <option value="maybe">Maybe</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => handleSubmit(event.id, performer.id)}>Save</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminEventAvailabilityPanel;
