// src/pages/Public/HireUs.tsx
import React, { useState } from 'react';
import { useRecaptcha } from './hooks/useRecaptcha';
import { submitClientRequest } from '../services/publicClient';

export default function HireUs() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', org: '',
    title: '', date: '', startTime: '', endTime: '', location: '', details: ''
  });
  const [ok, setOk] = useState<string>('');
  const { execute } = useRecaptcha();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const token = await execute('client_booking');
      const startIso = form.date && form.startTime ? new Date(`${form.date}T${form.startTime}`).toISOString() : undefined;
      const endIso = form.date && form.endTime ? new Date(`${form.date}T${form.endTime}`).toISOString() : undefined;
      await submitClientRequest({
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
      setOk('Thanks! Your request was received. We\'ll reach out soon.');
      setForm({ name:'', email:'', phone:'', org:'', title:'', date:'', startTime:'', endTime:'', location:'', details:'' });
    } catch (err: any) {
      alert(err?.message || 'Failed to send');
    }
  }

  return (
    <div style={{maxWidth: 720}}>
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
        <div style={{display:'flex', gap:'0.5rem'}}>
          <input type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} />
          <input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} />
        </div>
        <input placeholder="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
        <textarea placeholder="Details / repertoire / special notes" value={form.details} onChange={e=>setForm(f=>({...f,details:e.target.value}))} />

        <button type="submit">Submit request</button>
      </form>
      {ok && <p style={{marginTop:'0.75rem'}}>{ok}</p>}
    </div>
  );
}
