// =============================================
// FILE: src/pages/public/HireUs.tsx  (UPDATED)
// Purpose: Single public entry — always writes to `inquiries` for admin review
// - Keeps your reCAPTCHA + Apps Script email via submitClientRequest
// - Ensures Firestore write lands in `inquiries` with status 'new'
// - Defensive ISO building and UX polish
// =============================================
import React, { useState } from 'react';
import { useRecaptcha } from './hooks/useRecaptcha';
import { submitClientRequest } from '../services/publicClient';
import { createInquiry } from '../services/inquiries';
import './HireUs.css';

export default function HireUs() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', org: '',
    title: '', date: '', startTime: '', endTime: '', location: '', details: ''
  });
  const [ok, setOk] = useState<string>('');
  const [err, setErr] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const { execute } = useRecaptcha();

  const isoOrUndefined = (date: string, time: string) => {
    if (!date) return undefined;
    const t = time && time.length >= 4 ? time : '00:00';
    try { return new Date(`${date}T${t}:00`).toISOString(); } catch { return undefined; }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setOk(''); setErr(''); setBusy(true);

    try {
      if (!form.name.trim() || !form.email.trim()) {
        setErr('Please provide your name and email.');
        setBusy(false);
        return;
      }

      const token = await execute('client_booking');

      const basePayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        org: form.org.trim() || undefined,
        message: form.details.trim() || undefined,
        event: {
          title: (form.title || 'Client Inquiry').trim(),
          date: form.date || undefined,
          start: isoOrUndefined(form.date, form.startTime),
          end: isoOrUndefined(form.date, form.endTime),
          location: form.location.trim() || undefined,
        },
        meta: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      } as const;

      // 1) Email/notify (Apps Script or your backend)
      // 2) Persist to Firestore `inquiries` for admin review (status: 'new')
      await Promise.all([
        submitClientRequest({ recaptchaToken: token, ...basePayload } as any),
        createInquiry(basePayload),
      ]);

      setOk("Thanks! Your request was received. We'll reach out soon.");
      setForm({ name:'', email:'', phone:'', org:'', title:'', date:'', startTime:'', endTime:'', location:'', details:'' });
    } catch (e: any) {
      console.error('[HireUs submit] ', e);
      setErr(e?.message || 'Failed to send');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hireus">
      <h2>Hire Us</h2>
      <form onSubmit={onSubmit} className="event-form">
        <h3>Contact</h3>
        <input placeholder="Your name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
        <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
        <input placeholder="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
        <input placeholder="Organization (optional)" value={form.org} onChange={e=>setForm(f=>({...f,org:e.target.value}))} />

        <h3>Event</h3>
        <input placeholder="Event title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
        <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        <div className="time-row">
          <input type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} />
          <input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} />
        </div>
        <input placeholder="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
        <textarea placeholder="Details / repertoire / special notes" value={form.details} onChange={e=>setForm(f=>({...f,details:e.target.value}))} />

        <button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
        {ok && <p className="ok" role="status">{ok}</p>}
        {err && <p className="err" role="alert">{err}</p>}
      </form>
    </div>
  );
}


