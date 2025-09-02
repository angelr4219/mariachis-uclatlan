// =============================================
// FILE: src/components/events/EventCard.tsx
// Purpose: Single card with optional admin controls (edit/delete) and optional RSVP controls.
//          By default it's **view-only**. Admin pages enable `canManage`.
// =============================================
import React from 'react';
import './EventCard.css';

export type EventType = {
  id: string;
  title: string;
  subtitle?: string;
  dateStr: string; // e.g., Sat • Sep 14, 3:00–5:00 PM
  location?: string;
  status?: 'draft' | 'published' | 'cancelled';
  notes?: string;
};

interface Props {
  event: EventType;
  canManage?: boolean;
  canRSVP?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void; // NEW
}


const chip = (status?: Props['event']['status']) => {
  if (status === 'published') return <span className="status published">Published</span>;
  if (status === 'draft') return <span className="status draft">Draft</span>;
  if (status === 'cancelled') return <span className="status cancelled">Cancelled</span>;
  return null;
};

const EventCard: React.FC<Props> = ({ event, canManage = false, canRSVP = false, onEdit, onDelete }) => {
  return (
    <article className={`event-card ${event.status ?? ''}`}>
      <header className="event-head">
        <h3 className="event-title">{event.title}</h3>
        {chip(event.status)}
      </header>

      {event.subtitle && <p className="event-sub">{event.subtitle}</p>}

      <ul className="event-meta">
        <li><strong>When:</strong> {event.dateStr}</li>
        {event.location && <li><strong>Where:</strong> {event.location}</li>}
      </ul>

      {event.notes && <p className="event-notes">{event.notes}</p>}

      {/* ====== FOOTER: Actions ====== */}
      <footer className="event-actions">
        {/* Future: RSVP controls for members */}
        {canRSVP && (
          <div className="left-actions">
            <button className="btn">I can play</button>
            <button className="btn btn-light">Can’t make it</button>
          </div>
        )}

        {/* Admin manage controls */}
        {canManage && (
          <div className="right-actions">
            <button className="btn" onClick={() => onEdit?.(event.id)}>Edit</button>
            <button className="btn btn-danger" onClick={() => onDelete?.(event.id)}>Delete</button>
          </div>
        )}
      </footer>
    </article>
  );
};

export default EventCard;

