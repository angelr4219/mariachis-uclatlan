
// src/components/RSVPPanel.tsx
import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import type { RSVPDoc } from '../types/rsvp';
import type { EventItem } from '../types/events';
import { getMyRSVP, setRSVP } from '../services/events';
import './RSVPPanel.css';

export default function RSVPPanel({ event }: { event: EventItem }) {
  const user = getAuth().currentUser;
  const [mine, setMine] = useState<RSVPDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) { setLoading(false); return; }
      const r = await getMyRSVP(event.id, user.uid);
      if (alive) { setMine(r); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [event.id, user?.uid]);

  async function choose(status: RSVPDoc['status']) {
    if (!user) return;
    const r: RSVPDoc = {
      uid: user.uid,
      displayName: user.displayName ?? user.email ?? 'Unknown',
      role: mine?.role,
      status,
      updatedAt: Date.now(),
    };
    await setRSVP(event.id, r);
    setMine(r);
  }

  const disabled = event.status !== 'published';

  return (
    <div className="rsvp-panel">
      <button disabled={disabled} className={`rsvp-btn ${mine?.status === 'accepted' ? 'active' : ''}`} onClick={() => choose('accepted')}>Accept</button>
      <button disabled={disabled} className={`rsvp-btn ${mine?.status === 'tentative' ? 'active' : ''}`} onClick={() => choose('tentative')}>Tentative</button>
      <button disabled={disabled} className={`rsvp-btn ${mine?.status === 'declined' ? 'active' : ''}`} onClick={() => choose('declined')}>Decline</button>
      {loading && <span className="rsvp-loading">Loading…</span>}
    </div>
  );
}