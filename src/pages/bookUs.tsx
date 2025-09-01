// src/pages/Public/BookUs.tsx
import React, { useState } from 'react';
import { useRecaptcha } from './hooks/useRecaptcha';
import { submitClientRequest } from '../services/publicClient';
import './BookUs.css';

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  eventDate: string; // YYYY-MM-DD
  eventLocation: string;
  eventDetails: string;
  extraDetails: string;
  website?: string; // honeypot
}

const BookUs: React.FC = () => {
  const [formData, setFormData] = useState<BookingForm>({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventLocation: '',
    eventDetails: '',
    extraDetails: '',
    website: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { execute } = useRecaptcha();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    // honeypot — if bots fill, pretend success
    if (formData.website && formData.website.trim().length > 0) {
      setStatus('success');
      return;
    }

    try {
      setStatus('submitting');
      const token = await execute('client_booking');

      // Convert your existing fields → callable payload
      const startIso = formData.eventDate ? new Date(`${formData.eventDate}T09:00`).toISOString() : undefined;

      await submitClientRequest({
        recaptchaToken: token,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        org: undefined,
        message: [
          formData.eventDetails ? `Details: ${formData.eventDetails}` : '',
          formData.extraDetails ? `Extra: ${formData.extraDetails}` : ''
        ].filter(Boolean).join('\n'),
        event: {
          title: 'Client Inquiry',
          date: formData.eventDate || undefined,
          start: startIso,
          end: undefined,
          location: formData.eventLocation || undefined,
        }
      });

      setStatus('success');
      setFormData({
        name: '', email: '', phone: '', eventDate: '', eventLocation: '', eventDetails: '', extraDetails: '', website: ''
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to submit. Please try again later.');
    }
  }

  return (
    <section className="form-page bookus">
      <h1>Book Us</h1>
      <p>Please fill out this form to request a performance booking.</p>

      <form onSubmit={handleSubmit} className="bookus-form">
        {/* honeypot field (hidden from users) */}
        <input
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="hp"
          tabIndex={-1}
          aria-hidden
        />

        <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Your Email" value={formData.email} onChange={handleChange} required />
        <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
        <input name="eventDate" type="date" value={formData.eventDate} onChange={handleChange} required />
        <input name="eventLocation" placeholder="Event Location" value={formData.eventLocation} onChange={handleChange} required />
        <textarea name="eventDetails" placeholder="Tell us about your event..." value={formData.eventDetails} onChange={handleChange} required />
        <textarea name="extraDetails" placeholder="Anything else?" value={formData.extraDetails} onChange={handleChange} />

        <button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Submitting…' : 'Submit Request'}
        </button>

        {status === 'success' && (
          <p className="ok">Thank you for your inquiry! We will get back to you soon.</p>
        )}
        {status === 'error' && (
          <p className="err">{errorMsg}</p>
        )}
      </form>
    </section>
  );
};

export default BookUs;
