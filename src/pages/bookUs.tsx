
// ===============================
// 2) Implement /book-us and /join pages
//    Files: src/pages/bookUs.tsx, src/pages/joinUs.tsx
//    (names match existing imports in App.tsx)
// ===============================
// --- src/pages/bookUs.tsx ---
import React, { useState } from 'react';
import { sanitizeMessage, isValidPhoneE164, cleanPhone } from '../services/sanitize';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import '../pages/bookUs';

const BookUs: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
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
        details: sanitizeMessage(details, 2000),
        createdAt: serverTimestamp(),
        kind: 'performanceInquiry',
      };
      await addDoc(collection(db, 'inquiries'), payload);
      setStatus('Thanks! Your inquiry has been received.');
      setName(''); setEmail(''); setPhone(''); setDetails('');
    } catch (err: any) {
      console.error('[bookUs.submit] ', err);
      setStatus(err?.message ?? 'Sorry, something went wrong submitting your inquiry.');
    }
  };

  return (
    <section className="bj-page">
      <h1>Performance Inquiry</h1>
      <form className="bj-form" onSubmit={submit}>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Phone (optional)<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+13105551234" /></label>
        <label>Event details<textarea value={details} onChange={(e) => setDetails(e.target.value)} required /></label>
        <button type="submit">Send Request</button>
        {status && <p className="bj-status">{status}</p>}
      </form>
    </section>
  );
};
export default BookUs;