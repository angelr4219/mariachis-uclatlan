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
const EventCard: React.FC<EventCard> = ({ event, onClose }) => {
  return (
    <div className="event-card" onClick={onClick}>
      <h3>{event.title}</h3>
      <p>{event.date} at {event.time}</p>
      <p>{event.location}</p>
    </div>
  );
};

export default EventCard;
