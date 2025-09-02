import React from 'react';
import './EventModal.css';
import type { EventType } from './EventCard';

interface Props {
  event: EventType;
  onClose: () => void;
}

const EventModal: React.FC<Props> = ({ event, onClose }) => {
  // Split the date and time from dateStr if available
  const parts = event.dateStr ? event.dateStr.split(',') : [];
  const datePart = parts[0] ? parts[0].trim() : '';
  const timePart = parts[1] ? parts[1].trim() : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{event.title}</h2>

        {datePart && (
          <p>
            <strong>Date:</strong> {datePart}
          </p>
        )}
        {timePart && (
          <p>
            <strong>Time:</strong> {timePart}
          </p>
        )}
        {event.location && (
          <p>
            <strong>Location:</strong> {event.location}
          </p>
        )}
        {event.notes && <p className="modal-desc">{event.notes}</p>}

        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
