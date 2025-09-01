// =============================================
// FILE: src/components/RSVPButtons.tsx
// =============================================
import React from 'react';
import type { RSVPStatus } from '../types/events';
import './RSVPButtons.css';

interface Props {
  value?: RSVPStatus;
  onChange: (next: RSVPStatus) => void;
  compact?: boolean;
}

const LABELS: Record<RSVPStatus, string> = {
  accepted: 'Accept',
  tentative: 'Tentative',   // UI label, persisted as 'maybe'
  declined: 'Decline',
  none: 'No Response',
};

const KEYS: RSVPStatus[] = ['accepted', 'tentative', 'declined', 'none'];

const RSVPButtons: React.FC<Props> = ({ value, onChange, compact }) => {
  return (
    <div className={`rsvp-buttons ${compact ? 'compact' : ''}`}>
      {KEYS.map((k) => (
        <button
          key={k}
          className={`rsvp-btn ${value === k ? 'active' : ''} ${k}`}
          onClick={() => onChange(k)}
          type="button"
        >
          {LABELS[k]}
        </button>
      ))}
    </div>
  );
};

export default RSVPButtons;


