
// =============================================
// FILE: functions/src/scheduleEventSms.ts (Cloud Function)
// Requires: Blaze plan to deploy Functions; Twilio account
// Set config:  firebase functions:config:set twilio.sid="AC..." twilio.token="..." twilio.messaging_sid="MG..."
// =============================================
import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

admin.initializeApp();
const db = admin.firestore();

const twilioSid = process.env.TWILIO_ACCOUNT_SID || (functions.params as any).twilio?.sid;
const twilioToken = process.env.TWILIO_AUTH_TOKEN || (functions.params as any).twilio?.token;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || (functions.params as any).twilio?.messaging_sid;

const client = twilio(twilioSid, twilioToken);

export const scheduleEventSms = functions.onCall(async (req) => {
  const { eventId, uid, overridePhone, trajePickupAt } = req.data as {
    eventId: string; uid: string; overridePhone?: string | null; trajePickupAt?: string | null;
  };
  if (!eventId || !uid) throw new functions.HttpsError('invalid-argument', 'Missing eventId or uid');

  const evRef = db.collection('events').doc(eventId);
  const userRef = db.collection('users').doc(uid);
  const assignRef = evRef.collection('assignments').doc(uid);

  const [evSnap, userSnap, assignSnap] = await Promise.all([evRef.get(), userRef.get(), assignRef.get()]);
  if (!evSnap.exists) throw new functions.HttpsError('not-found', 'Event not found');
  if (!userSnap.exists) throw new functions.HttpsError('not-found', 'User not found');

  const ev = evSnap.data() as any;
  const user = userSnap.data() as any;
  const assign = assignSnap.exists ? assignSnap.data() as any : {};

  const start: Date | null = ev.start?.toDate ? ev.start.toDate() : (ev.start ? new Date(ev.start) : null);
  const phone: string | null = overridePhone || assign.phoneNumber || user.phoneNumber || null;
  if (!phone) throw new functions.HttpsError('failed-precondition', 'No phone number on file');

  const traje = assign.trajeNumbers || user.traje || {
    jacket: user.trajeJacket, vest: user.trajeVest, pants: user.trajePants
  };

  const pickup: Date | null = trajePickupAt ? new Date(trajePickupAt) : (assign.trajePickupAt?.toDate ? assign.trajePickupAt.toDate() : null);

  const fmt = (d: Date | null) => d ? d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: '2-digit' }) : 'TBA';

  const immediateBody = `Thank you for reporting your availability for "${ev.title}".\n`+
    `Traje pickup is scheduled for: ${fmt(pickup)}.\n`+
    `Previous traje numbers — Jacket: ${traje?.jacket||'-'}, Vest: ${traje?.vest||'-'}, Pants: ${traje?.pants||'-'}.\n`+
    `Reply STOP to opt out.`;

  // Send immediate confirmation
  const sent = await client.messages.create({
    to: phone,
    messagingServiceSid,
    body: immediateBody,
  });

  // Schedule reminders using Twilio's message scheduling (if enabled on your account)
  // If not available, you can implement a Pub/Sub scheduled function that polls a smsQueue.
  const scheduleIfPossible = async (msBefore: number, label: string) => {
    if (!start) return null;
    const when = new Date(start.getTime() - msBefore);
    // Twilio: scheduleType + sendAt ISO8601 (requires Messaging Service)
    try {
      const r = await client.messages.create({
        to: phone,
        messagingServiceSid,
        body: `${label}: "${ev.title}" at ${fmt(start)} (Location: ${ev.location||'TBA'}). See you soon! Reply STOP to opt out.`,
        scheduleType: 'fixed' as any,
        sendAt: when.toISOString(),
      } as any);
      return r.sid;
    } catch (err) {
      console.warn('Scheduling not supported or failed; consider Cloud Scheduler fallback', err);
      return null;
    }
  };

  const sidMinus1d = await scheduleIfPossible(24*60*60*1000, 'Reminder (1 day before)');
  const sidMinus2h = await scheduleIfPossible(2*60*60*1000, 'Reminder (2 hours before)');

  await assignRef.set({
    sms: {
      immediateSid: sent.sid,
      minus1dSid: sidMinus1d,
      minus2hSid: sidMinus2h,
    }
  }, { merge: true });

  return { ok: true, immediateSid: sent.sid, sidMinus1d, sidMinus2h };
});
```

```ts