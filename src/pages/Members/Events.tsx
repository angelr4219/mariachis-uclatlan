// src/pages/Members/Events.tsx
import { useState } from 'react';
import EventCard from '../../components/EventCard';
import EventModal from '../../components/EventModal';
import './Events.css';

interface EventType {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

const eventsData: EventType[] = [
  {
    id: 1,
    title: 'Spring Recital',
    date: '2025-05-10',
    time: '7:00 PM',
    location: 'Royce Hall, UCLA',
    description: 'Join us for our annual spring recital showcasing traditional mariachi music!'
  },
  {
    id: 2,
    title: 'Community Festival Performance',
    date: '2025-06-05',
    time: '2:00 PM',
    location: 'Olvera Street, Los Angeles',
    description: 'Celebrate with us at Olvera Street with live mariachi music and cultural festivities.'
  },
  {
    id: 3,
    title: 'test',
    date: '2025-06-05',
    time: '3:00 PM',
    location: 'Olvera Street, Los Angeles',
    description: 'Celebrate with us at Olvera Street with live mariachi music and cultural festivities.'
  }
  // Add more events here
];

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

  return (
    <div className="events-page">
      <h1>Upcoming Performances</h1>
      <div className="events-grid">
        {eventsData.map(event => (
          <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
        ))}
      </div>
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

export default Events;
