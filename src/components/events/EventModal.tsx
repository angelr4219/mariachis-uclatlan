import React from 'react';
import './EventModal.css';
import type { EventType } from './EventCard';


interface Props {
event: EventType;
onClose: () => void;
}


const EventModal: React.FC<Props> = ({ event, onClose }) => {
return (
<div className="modal-overlay" onClick={onClose}>
<div className="modal-content" onClick={(e) => e.stopPropagation()}>
<h2 className="modal-title">{event.title}</h2>
<p><strong>Date:</strong> {event.date}</p>
<p><strong>Time:</strong> {event.time}</p>
{event.location && <p><strong>Location:</strong> {event.location}</p>}
{event.description && <p className="modal-desc">{event.description}</p>}
<div className="modal-actions">
<button onClick={onClose}>Close</button>
</div>
</div>
</div>
);
};


export default EventModal;