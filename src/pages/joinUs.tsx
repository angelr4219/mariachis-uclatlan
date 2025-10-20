

// --- src/pages/joinUs.tsx ---
import React, { useState } from 'react';
import { sanitizeMessage, isValidPhoneE164, cleanPhone } from '../services/sanitize';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import '../pages/Joinus.css';

const Join: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instrument, setInstrument] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const phoneClean = cleanPhone(phone);
    if (phone && !isValidPhoneE164(phoneClean)) {
      setStatus('Please enter a valid phone number in +1########## format.');
      return;
    }

    try {
      const payload = {
        name: name.trim().slice(0, 200),
        email: email.trim().toLowerCase(),
        phone: phoneClean,
        instrument: instrument.trim().slice(0, 100),
        message: sanitizeMessage(message, 2000),
        createdAt: serverTimestamp(),
        kind: 'joinRequest',
      };
      await addDoc(collection(db, 'joinRequests'), payload);
      setStatus('Thanks! We will reach out soon.');
      setName(''); setEmail(''); setPhone(''); setInstrument(''); setMessage('');
    } catch (err: any) {
      console.error('[join.submit] ', err);
      setStatus(err?.message ?? 'Sorry, something went wrong submitting your request.');
    }
  };

  return (
    <section className="bj-page">
      <h1>Join Mariachi de Uclatlán</h1>
      <form className="bj-form" onSubmit={submit}>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Phone (optional)<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+13105551234" /></label>
        <label>Instrument<input value={instrument} onChange={(e) => setInstrument(e.target.value)} required /></label>
        <label>Message<textarea value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <button type="submit">Submit</button>
        {status && <p className="bj-status">{status}</p>}
      </form>
    </section>
  );
};
export default Join;
