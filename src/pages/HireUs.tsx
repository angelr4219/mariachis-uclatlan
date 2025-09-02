// ================================
// FILE: src/pages/HireUs.tsx
// Desc: Client booking form with richer error display + basic validation
// ================================
import React, { useState } from 'react';
import { useRecaptcha } from './hooks/useRecaptcha';
import { submitClientRequest } from '../services/publicClient';
import './HireUs.css';

const HireUs: React.FC = () => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', org: '',
    title: '', date: '', startTime: '', endTime: '', location: '', details: ''
  });
  const [ok, setOk] = useState<string>('');
  const [err, setErr] = useState<string>('');
  const [debug, setDebug] = useState<string>(''); // shows server details if available
  const { execute } = useRecaptcha();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(''); setErr(''); setDebug('');
    try {
      // Basic front-end guardrails
      if (!form.email || !form.name) {
        setErr('Please enter your name and email.');
        return;
      }

      const token = await execute('client_booking');
      if (!token) {
        setErr('reCAPTCHA could not be verified. Please refresh and try again.');
        return;
      }

      const startIso = form.date && form.startTime ? new Date(`${form.date}T${form.startTime}`).toISOString() : undefined;
      const endIso = form.date && form.endTime ? new Date(`${form.date}T${form.endTime}`).toISOString() : undefined;

      const res = await submitClientRequest({
        recaptchaToken: token,
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        org: form.org || undefined,
        message: form.details || undefined,
        event: {
          title: form.title || 'Client Inquiry',
          date: form.date || undefined,
          start: startIso,
          end: endIso,
          location: form.location || undefined,
        }
      });

      // If service returns a JSON object with status/message, handle it
      if ((res as any)?.error || (res as any)?.status === 'error') {
        const serverMsg = (res as any)?.message || (res as any)?.error || 'Server reported an error';
        setErr(serverMsg);
        setDebug(JSON.stringify(res, null, 2));
        return;
      }

      setOk("Thanks! Your request was received. We'll reach out soon.");
      setForm({ name:'', email:'', phone:'', org:'', title:'', date:'', startTime:'', endTime:'', location:'', details:'' });
    } catch (e: any) {
      // Show as much detail as is safe for debugging
      const msg = e?.message || 'Failed to send';
      setErr(msg);
      if (e?.responseJson) setDebug(JSON.stringify(e.responseJson, null, 2));
      else if (e?.responseText) setDebug(String(e.responseText));
      else if (e?.stack) setDebug(String(e.stack));
      else setDebug(JSON.stringify(e, null, 2));
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
        <input placeholder="Event title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
        <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        <div className="time-row">
          <input type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} />
          <input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} />
        </div>
        <input placeholder="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
        <textarea placeholder="Details / repertoire / special notes" value={form.details} onChange={e=>setForm(f=>({...f,details:e.target.value}))} />

        <button type="submit">Submit request</button>
        {ok && <p className="ok" role="status">{ok}</p>}
        {err && <p className="err" role="alert">{err}</p>}
        {/* Debug section only shows when there's an error */}
        {err && debug && (
          <pre className="debug-blame" aria-live="polite">{debug}</pre>
        )}
      </form>
    </div>
  );
};

export default HireUs;


// ================================
// FILE: src/services/publicClient.ts
// Desc: Thin client for Apps Script / Cloud Function endpoint + strong error reporting
// ================================
export type ClientRequestPayload = {
  recaptchaToken: string;
  name: string;
  email: string;
  phone?: string;
  org?: string;
  message?: string;
  event?: {
    title?: string;
    date?: string;
    start?: string; // ISO
    end?: string;   // ISO
    location?: string;
  };
};

const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL; // must be defined

export async function submitClientRequest(payload: ClientRequestPayload): Promise<any> {
  if (!BASE_URL) {
    const e = new Error('Missing VITE_APPS_SCRIPT_URL environment variable.');
    (e as any).hint = 'Set VITE_APPS_SCRIPT_URL in your .env and restart dev server.';
    throw e;
  }

  const res = await fetch(`${BASE_URL}/clientRequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // credentials not typically needed for Apps Script; add if your backend requires
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {
    // leave json as null; backend might return plain text
  }

  if (!res.ok) {
    const err = new Error(json?.message || json?.error || `${res.status} ${res.statusText}`);
    (err as any).responseText = text;
    (err as any).responseJson = json;
    (err as any).status = res.status;
    throw err;
  }

  // Success path: return parsed JSON (or raw text fallback)
  return json ?? { ok: true, raw: text };
}

