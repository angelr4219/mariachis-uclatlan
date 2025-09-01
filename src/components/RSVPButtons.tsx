

import React from 'react';
import type { RSVPStatus } from '../types/events';

interface Props {
  value?: RSVPStatus;
  onChange: (next: RSVPStatus) => void;
  compact?: boolean;
}

const labels: Record<Exclude<RSVPStatus, 'none'>, string> = {
  accepted: 'Accept',
  tentative: 'Tentative',
  declined: 'Decline',
};

const RSVPButtons: React.FC<Props> = ({ value, onChange, compact }) => {
  return (
    <div className={`rsvp-buttons ${compact ? 'compact' : ''}`}>
      {(['accepted','tentative','declined'] as const).map(k => (
        <button
          key={k}
          className={`rsvp-btn ${value===k ? 'active' : ''} ${k}`}
          onClick={() => onChange(k)}
          type="button"
        >{labels[k]}</button>
      ))}
    </div>
  );
};

export default RSVPButtons;
