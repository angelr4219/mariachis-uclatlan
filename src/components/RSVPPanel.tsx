// =============================================
// FILE: src/components/RSVPPanel.tsx
// =============================================
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import type { RSVPDoc } from '../types/rsvp';
import type { EventItem, RSVPStatus } from '../types/events';
import { getMyRSVP, setRSVP } from '../services/events';
import RSVPButtons from './RSVPButtons';
import './RSVPPanel.css';

export default function RSVPPanel({ event }: { event: EventItem }) {
  const [uid, setUid] = useState<string | undefined>(undefined);
  const [mine, setMine] = useState<RSVPDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const disabled = event.status !== 'published';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUid(undefined);
        setMine(null);
        setLoading(false);
        return;
      }
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
      role: mine?.role ?? undefined, // ✅ use undefined instead of null
      status: next,
      updatedAt: Date.now(),
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
