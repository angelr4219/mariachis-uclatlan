// src/components/RSVPPanel.tsx
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import type { RSVPDoc } from '../types/rsvp';
import type { EventItem, RSVPStatus } from '../types/events';
import { getMyRSVP, setRSVP } from '../services/events';
import RSVPButtons from './RSVPButtons';
import './RSVPPanel.css';

export default function RSVPPanel({ event }: { event: EventItem }) {
  const [uid, setUid] = useState<string | null>(null);
  const [mine, setMine] = useState<RSVPDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const disabled = event.status !== 'published';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setUid(null); setMine(null); setLoading(false); return; }
      setUid(u.uid);
      setLoading(true);
      const r = await getMyRSVP(event.id, u.uid);
      setMine(r);
      setLoading(false);
    });
    return () => unsub();
  }, [event.id]);

  const handleChange = async (next: RSVPStatus) => {
    if (!uid) return;

    const r: RSVPDoc = {
      uid,
      status: next,                // 'accepted' | 'maybe' | 'declined'
      updatedAt: Date.now(),
      ...(mine?.role ? { role: mine.role } : {}),                // ✅ no nulls
      ...(mine?.displayName ? { displayName: mine.displayName } : {}), // ✅ if your type includes it
    };

    await setRSVP(event.id, r);
    setMine(r);
  };

  return (
    <div className="rsvp-panel">
      <RSVPButtons value={mine?.status} onChange={handleChange} compact />
      {disabled && <span className="rsvp-note">RSVP disabled (event not published)</span>}
      {loading && <span className="rsvp-loading">Loading…</span>}
    </div>
  );
}
