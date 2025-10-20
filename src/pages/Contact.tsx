// ===============================
// File: src/pages/Contact.tsx
// Purpose: Public intake form with time RANGE and duration preview
// Behavior: Calls submitContactInquiry (service) to create Inquiry + Event
// ===============================
import React, { useMemo, useState } from 'react';
import './Contact.css';
import { cleanPhone, isValidPhoneE164, sanitizeMessage } from '../services/sanitize';
import { submitContactInquiry } from '../services/contactSubmit';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(''); // YYYY-MM-DD
  const [startTime, setStartTime] = useState(''); // HH:MM (24h)
  const [endTime, setEndTime] = useState('');     // HH:MM (24h)
  const [details, setDetails] = useState('');

  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // compute duration in minutes (same-day assumption)
  const durationMinutes = useMemo(() => {
    if (!eventDate || !startTime || !endTime) return null;
    const start = new Date(`${eventDate}T${startTime}:00`);
    const end = new Date(`${eventDate}T${endTime}:00`);
    const ms = end.getTime() - start.getTime();
    if (!isFinite(ms) || ms <= 0) return 0; // invalid or negative -> 0
    return Math.round(ms / 60000);
  }, [eventDate, startTime, endTime]);

  const durationLabel = useMemo(() => {
    if (durationMinutes === null) return '';
    const m = Math.max(0, durationMinutes);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h > 0 && mm > 0) return `${h}h ${mm}m`;
    if (h > 0) return `${h}h`;
    return `${mm}m`;
  }, [durationMinutes]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setStatus(null);

    // basic validation
    const phoneClean = cleanPhone(phone);
    if (phone && !isValidPhoneE164(phoneClean)) {
      setStatus('Please enter a valid phone number in +1########## format.');
      return;
    }
    if (!name.trim() || !email.trim()) {
      setStatus('Name and email are required.');
      return;
    }
    if (!eventDate || !startTime || !endTime) {
      setStatus('Please provide a date, start time, and end time.');
      return;
    }

    const startISO = `${eventDate}T${startTime}:00`;
    const endISO = `${eventDate}T${endTime}:00`;
    const start = new Date(startISO);
    const end = new Date(endISO);
    if (!(isFinite(start.getTime()) && isFinite(end.getTime()) && end > start)) {
      setStatus('End time must be after start time.');
      return;
    }

    const duration = Math.round((end.getTime() - start.getTime()) / 60000);

    setSubmitting(true);
    try {
      await submitContactInquiry({
        name: name.trim().slice(0, 200),
        email: email.trim().toLowerCase(),
        phone: phoneClean || null,
        eventTitle: (eventTitle || 'Performance Inquiry').trim().slice(0, 140),
        details: sanitizeMessage(details, 3000),
        dateISO: eventDate,
        startTime, // HH:MM
        endTime,   // HH:MM
        startISO,
        endISO,
        durationMinutes: duration,
        source: 'contactForm',
      });

      setStatus('Thanks! Your request has been received. Our team will follow up shortly.');
      setName(''); setEmail(''); setPhone(''); setEventTitle(''); setEventDate(''); setStartTime(''); setEndTime(''); setDetails('');
    } catch (err: any) {
      console.error('[Contact.onSubmit] error', err);
      setStatus(err?.message ?? 'Sorry, something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="contact-page">
      <h1 className="contact-title">Contact Us</h1>
      <p className="contact-intro">
        Prefer email? Reach us at <a href="mailto:uclaltan@ucla.edu">uclatlan@ucla.edu</a>. For performances and general inquiries, use the form below.
      </p>

      <form className="contact-form" onSubmit={onSubmit}>
        <div className="row-2">
          <label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        </div>
        <div className="row-2">
          <label>Phone <input type="tel" placeholder="+13105551234" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label>Event name<input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g., Wedding Reception" /></label>
        </div>
        <div className="row-3">
          <label>Date<input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required /></label>
          <label>Start time<input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></label>
          <label>End time<input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></label>
        </div>
        {durationMinutes !== null && (
          <p className="duration-note">Duration: <strong>{durationLabel}</strong> ({Math.max(0, durationMinutes)} min)</p>
        )}
        <label>Details<textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Venue, set length, audience size, special requests…" /></label>

        <button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send Request'}</button>
        {status && <p className="contact-status">{status}</p>}
      </form>
    </section>
  );
};

export default Contact;
