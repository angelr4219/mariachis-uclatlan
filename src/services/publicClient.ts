// src/services/publicClient.ts
const APPS_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;


export type ClientRequestPayload = {
name: string;
email: string;
phone?: string;
org?: string;
message?: string;
event?: {
title?: string;
date?: string; // ISO or free text
start?: string; // optional
end?: string; // optional
location?: string;
};
};


/**
* Sends a booking/inquiry to Apps Script using application/x-www-form-urlencoded
* to avoid CORS preflight. The Apps Script doPost(e) will read e.parameter.*
*/
export async function submitClientRequest(payload: ClientRequestPayload & { recaptchaToken: string }) {
if (!APPS_URL) throw new Error('Missing VITE_APPS_SCRIPT_URL');
const params = new URLSearchParams();
params.set('recaptchaToken', payload.recaptchaToken);
params.set('name', payload.name);
params.set('email', payload.email);
if (payload.phone) params.set('phone', payload.phone);
if (payload.org) params.set('org', payload.org);
if (payload.message) params.set('message', payload.message);
if (payload.event) params.set('event', JSON.stringify(payload.event));


const res = await fetch(APPS_URL, { method: 'POST', body: params });
if (!res.ok) throw new Error(await res.text());
const text = await res.text();
return text; // or JSON.parse if your script returns JSON
}