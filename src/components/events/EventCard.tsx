import React from 'react';
import './EventCard.css';

export interface EventType {
  id: string;
  title: string;
  date: string;       // e.g., "Sep 2, 2025"
  time: string;       // e.g., "3:00 PM – 5:00 PM"
  location: string;
  description: string;
  status?: 'draft' | 'published' | 'cancelled';
}

interface Props {
  event: EventType;
  onClick: () => void;
}

const EventCardBase: React.FC<Props> = ({ event, onClick }) => {
  const statusClass = event.status ? `status-${event.status}` : '';

  return (
    <button
      type="button"
      className={`event-card ${statusClass}`}
      onClick={onClick}
      aria-label={`Open details for ${event.title}`}
      title={event.title}
      data-id={event.id}
    >
      <h3 className="event-title">{event.title}</h3>
      <p className="event-meta">{event.date} · {event.time}</p>
      {event.location && <p className="event-loc">{event.location}</p>}
    </button>
  );
};

const EventCard = React.memo(EventCardBase);
export default EventCard;
