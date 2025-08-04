import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';

interface EventData {
  id?: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

const ManageEvents: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [newEvent, setNewEvent] = useState<EventData>({ title: '', date: '', location: '', description: '' });
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchEvents = async () => {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as EventData[];
      setEvents(eventsData);
    };

    fetchEvents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof EventData, eventId?: string) => {
    const { value } = e.target;
    if (eventId) {
      setEvents(prevEvents => prevEvents.map(event => event.id === eventId ? { ...event, [field]: value } : event));
    } else {
      setNewEvent(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) return alert('Title and Date are required!');
    await addDoc(collection(db, 'events'), newEvent);
    setNewEvent({ title: '', date: '', location: '', description: '' });
    window.location.reload();
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteDoc(doc(db, 'events', eventId));
    window.location.reload();
  };

  const handleSaveEdit = async (eventId: string) => {
    const eventToUpdate = events.find(e => e.id === eventId);
    if (eventToUpdate) {
      const { id, ...updateData } = eventToUpdate;
      await updateDoc(doc(db, 'events', eventId), updateData);
      setEditMode(prev => ({ ...prev, [eventId]: false }));
      alert('Event updated!');
    }
  };

  return (
    <div>
      <h2>Manage Events</h2>
      <div style={{ marginBottom: '2rem' }}>
        <h3>Add New Event</h3>
        <input
          type="text"
          placeholder="Title"
          value={newEvent.title}
          onChange={(e) => handleInputChange(e, 'title')}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="date"
          value={newEvent.date}
          onChange={(e) => handleInputChange(e, 'date')}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="text"
          placeholder="Location"
          value={newEvent.location}
          onChange={(e) => handleInputChange(e, 'location')}
          style={{ marginRight: '1rem' }}
        />
        <textarea
          placeholder="Description"
          value={newEvent.description}
          onChange={(e) => handleInputChange(e, 'description')}
          rows={2}
          style={{ width: '100%', marginTop: '0.5rem' }}
        ></textarea>
        <button onClick={handleAddEvent} style={{ marginTop: '1rem' }}>Add Event</button>
      </div>

      <h3>Existing Events</h3>
      {events.map(event => (
        <div key={event.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          {editMode[event.id!] ? (
            <>
              <input
                type="text"
                value={event.title}
                onChange={(e) => handleInputChange(e, 'title', event.id)}
                style={{ marginBottom: '0.5rem' }}
              />
              <input
                type="date"
                value={event.date}
                onChange={(e) => handleInputChange(e, 'date', event.id)}
                style={{ marginBottom: '0.5rem' }}
              />
              <input
                type="text"
                value={event.location}
                onChange={(e) => handleInputChange(e, 'location', event.id)}
                style={{ marginBottom: '0.5rem' }}
              />
              <textarea
                value={event.description}
                onChange={(e) => handleInputChange(e, 'description', event.id)}
                rows={2}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              ></textarea>
              <button onClick={() => handleSaveEdit(event.id!)}>Save</button>
              <button onClick={() => setEditMode(prev => ({ ...prev, [event.id!]: false }))} style={{ marginLeft: '0.5rem' }}>Cancel</button>
            </>
          ) : (
            <>
              <h4>{event.title}</h4>
              <p>{event.date} | {event.location}</p>
              <p>{event.description}</p>
              <button onClick={() => setEditMode(prev => ({ ...prev, [event.id!]: true }))}>Edit</button>
              <button onClick={() => handleDeleteEvent(event.id!)} style={{ marginLeft: '0.5rem', color: 'red' }}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ManageEvents;
