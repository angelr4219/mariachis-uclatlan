// src/components/events/EventCard.tsx
import React from 'react';
import type { EventCardVM } from '../../types/events';
import './EventCard.css';

export type EventType = EventCardVM;

type Props = {
  event: EventType;
  onClick?: () => void;
};

const EventCard: React.FC<Props> = ({ event, onClick }) => {
  return (
    <div className="event-card" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="event-head">
        <h3>{event.title}</h3>
        <span className={`pill pill-${event.status}`}>{event.status}</span>
      </div>
      <div className="event-sub">
        {event.date} • {event.time} • {event.location}
      </div>
      {event.description && <p className="event-notes">{event.description}</p>}
    </div>
  );
};

export default EventCard;
