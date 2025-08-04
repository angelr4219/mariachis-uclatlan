import React from 'react';
import './EventCard.css'; // Style your card here

const EventCard = ({ event, onClick }) => {
  return (
    <div className="event-card" onClick={onClick}>
      <h3>{event.title}</h3>
      <p>{event.date} at {event.time}</p>
      <p>{event.location}</p>
    </div>
  );
};

export default EventCard;
