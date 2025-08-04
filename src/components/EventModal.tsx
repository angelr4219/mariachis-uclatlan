import React from 'react';
import './EventModal.css'; // Style your modal here

interface EventModalProps {
  event: {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
  };
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{event.title}</h2>
        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Time:</strong> {event.time}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p>{event.description}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default EventModal;
