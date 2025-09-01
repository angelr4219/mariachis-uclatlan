import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '.././firebase';


export type ClientEventPayload = {
title?: string;
date?: string; // YYYY-MM-DD
start?: string; // ISO
end?: string; // ISO
location?: string;
};


export type SubmitClientRequestInput = {
recaptchaToken?: string;
name: string;
email: string;
phone?: string;
org?: string;
message?: string;
event?: ClientEventPayload;
};


export async function submitClientRequest(input: SubmitClientRequestInput) {
// If your functions are in a specific region, pass it as 2nd arg, e.g. 'us-central1'
const functions = getFunctions(app /*, 'us-central1' */);
const fn = httpsCallable(functions, 'submitClientBooking');


const descLines = [
input.message ? `Message: ${input.message}` : '',
input.org ? `Organization: ${input.org}` : '',
input.event?.date ? `Requested Date: ${input.event.date}` : ''
].filter(Boolean);


const payload = {
recaptchaToken: input.recaptchaToken,
name: input.name,
email: input.email,
phone: input.phone || null,
title: input.event?.title || 'Client Inquiry',
location: input.event?.location || '',
startISO: input.event?.start,
endISO: input.event?.end,
description: descLines.join('\n'),
rolesNeeded: [] as Array<{ role: string; count: number }>,
};


const res = await fn(payload);
return res.data as { ok: boolean; clientId: string; inquiryId: string; eventId: string };
}