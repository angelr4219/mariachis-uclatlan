import React, { useState } from 'react';

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
  const [debugResponse, setDebugResponse] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Sends a POST to your Apps Script Web App.
   * 1) Try normal CORS so we can see HTTP status/body while debugging.
   * 2) If it throws (e.g., org blocks cross-origin), fall back to no-cors/text/plain.
   */
  const sendToGoogleSheet = async (data: BookingForm) => {
    const url = import.meta.env.VITE_GSHEET_WEBAPP_URL as string;
    if (!url) throw new Error('Missing VITE_GSHEET_WEBAPP_URL');

    // First: normal request (so Network tab shows real status/body)
    try {
      console.log('[BookUs] POST →', url, data);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const text = await res.text();
      console.log('[BookUs] status', res.status, 'body', text);
      setDebugResponse(`status ${res.status}: ${text}`);
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      const json = JSON.parse(text || '{}');
      if (!json || json.status !== 'ok') {
        throw new Error(json?.message || 'Unexpected response from Google Apps Script');
      }
      return; // success
    } catch (err) {
      console.warn('[BookUs] normal POST failed, retrying with no-cors fallback', err);
    }

    // Second: no-cors fallback (opaque). Sheet/email should still happen if endpoint allows anonymous.
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(data)
      });
      setDebugResponse('(no-cors fallback used; response not readable)');
    } catch (err: any) {
      setDebugResponse(`no-cors fallback error: ${err?.message || String(err)}`);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // honeypot — if bots fill, pretend success
    if (formData.website && formData.website.trim().length > 0) {
      setStatus('success');
      return;
    }

    try {
      setStatus('submitting');
      await sendToGoogleSheet(formData);
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        eventDate: '',
        eventLocation: '',
        eventDetails: '',
        extraDetails: '',
        website: ''
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to submit. Please try again later.');
    }
  };

  // Debug helper: GET the newest rows from the Sheet via Apps Script
  const fetchLatest = async () => {
    try {
      const url = import.meta.env.VITE_GSHEET_WEBAPP_URL as string;
      if (!url) throw new Error('Missing VITE_GSHEET_WEBAPP_URL');
      const listUrl = `${url}?action=list&limit=5`;
      const res = await fetch(listUrl);
      const text = await res.text();
      setDebugResponse(`GET ${listUrl} → ${res.status}: ${text}`);
    } catch (e: any) {
      setDebugResponse(`GET error: ${e?.message || String(e)}`);
    }
  };

  return (
    <section className="form-page" style={{ padding: '1rem' }}>
      <h1>Book Us</h1>
      <p>Please fill out this form to request a performance booking.</p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        {/* honeypot field (hidden from users) */}
        <input
          name="website"
          value={formData.website}
          onChange={handleChange}
          style={{ position: 'absolute', left: -9999, opacity: 0, height: 0, width: 0 }}
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
          <p style={{ marginTop: 12 }}>Thank you for your inquiry! We will get back to you soon.</p>
        )}
        {status === 'error' && (
          <p style={{ marginTop: 12, color: 'salmon' }}>{errorMsg}</p>
        )}
      </form>

      {/* ===== Debug tools (remove when done) ===== */}
      <div style={{ marginTop: 24, padding: 12, border: '1px dashed #ccc', borderRadius: 8 }}>
        <strong>Debug</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={fetchLatest}>Check latest 5 submissions</button>
        </div>
        {debugResponse && (
          <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{debugResponse}</pre>
        )}
      </div>
    </section>
  );
};

export default BookUs;
