// src/pages/Public/ClientBooking.tsx
import React, { useState } from 'react';
import { useRecaptcha } from './hooks/useRecaptcha';
import { submitClientRequest } from '../services/publicClient';
import './ClientBooking.css';


const initial = { name: '', email: '', phone: '', org: '', message: '', date: '', start: '', end: '', location: '' };


const ClientBooking: React.FC = () => {
const [f, setF] = useState(initial);
const [busy, setBusy] = useState(false);
const [ok, setOk] = useState<string | null>(null);
const [err, setErr] = useState<string | null>(null);
const { execute } = useRecaptcha();


async function onSubmit(e: React.FormEvent) {
e.preventDefault();
setBusy(true); setOk(null); setErr(null);
try {
const token = await execute('client_booking');
await submitClientRequest({
name: f.name,
email: f.email,
phone: f.phone || undefined,
org: f.org || undefined,
message: f.message || undefined,
event: {
title: 'Client Inquiry',
date: f.date || undefined,
start: f.start || undefined,
end: f.end || undefined,
location: f.location || undefined,
},
recaptchaToken: token,
});
setOk('Thanks! Your request was sent. We will reach out soon.');
setF(initial);
} catch (e: any) {
setErr(e?.message || 'Failed to send');
} finally {
setBusy(false);
}
}


function upd<K extends keyof typeof initial>(k: K) {
return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
setF((s) => ({ ...s, [k]: e.target.value }));
}


return (
<div className="booking-wrap">
<h1>Book Mariachi de Uclatlán</h1>
<form onSubmit={onSubmit} className="booking-form">
<div className="grid">
<label> Name<input required value={f.name} onChange={upd('name')} /></label>
<label> Email<input required type="email" value={f.email} onChange={upd('email')} /></label>
<label> Phone<input value={f.phone} onChange={upd('phone')} /></label>
<label> Organization<input value={f.org} onChange={upd('org')} /></label>
<label> Date<input type="date" value={f.date} onChange={upd('date')} /></label>
<label> Start Time<input type="time" value={f.start} onChange={upd('start')} /></label>
<label> End Time<input type="time" value={f.end} onChange={upd('end')} /></label>
<label> Location<input value={f.location} onChange={upd('location')} /></label>
</div>
<label> Message<textarea rows={4} value={f.message} onChange={upd('message')} /></label>
<button disabled={busy} className="btn">{busy ? 'Sending…' : 'Send Request'}</button>
{ok && <div className="ok">{ok}</div>}
{err && <div className="err">{err}</div>}
</form>
</div>
);
};


export default ClientBooking;