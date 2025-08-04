import React from 'react';
import './EventCard.css'; // Style your card here

interface EventCard {
    event: {
      title: string;
      date: string;
      time: string;
      location: string;
      description: string;
    };
    onClose: () => void;
    onClick: () => void;
  }
  const EventCard: React.FC<{ event: EventType; onClick: () => void }> = ({ event, onClick }) => {
    return (
      <div className="event-card" onClick={onClick}>
       <div className="event-card" onClick={onClick}>
  <h3>{event.title}</h3>
  <p>{event.date} — {event.location}</p>
</div>

      </div>
    );
  };
  export interface EventType {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
  }
  

export default EventCard;
