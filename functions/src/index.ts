// =============================================
// FILE: functions/src/index.ts (Cloud Functions - TypeScript)
// Purpose: Secure callable function to grant/remove Firebase custom claims.
// Notes:
//  - Requires Firebase Admin SDK and Firebase Functions: `firebase init functions` (TypeScript)
//  - Protect by allow‑listing super admins (emails you already control) and/or App Check.
// =============================================
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Change to your super‑admin list (people allowed to modify roles)
const SUPER_ADMINS = new Set([
  'angelrocks0319@gmail.com',
  'angelr19@ucla.edu',
  'angelr19@g.ucla.edu',
]);

export const setUserRole = functions.https.onCall(async (data, context) => {
  // 1) Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in first.');
  }
  const callerEmail = context.auth.token.email as string | undefined;
  if (!callerEmail || !SUPER_ADMINS.has(callerEmail.toLowerCase())) {
    throw new functions.https.HttpsError('permission-denied', 'Not allowed.');
  }

  // 2) Input validation
  const { email, role } = data as { email: string; role: 'admin' | 'performer' | 'none' };
  if (!email || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'email and role are required');
  }

  // 3) Look up user by email and set claims
  const user = await admin.auth().getUserByEmail(email);

  let claims: Record<string, any> = {};
  if (role === 'admin') claims = { admin: true, role: 'admin' };
  else if (role === 'performer') claims = { performer: true, role: 'performer' };
  else claims = {}; // remove claims

  await admin.auth().setCustomUserClaims(user.uid, claims);

  // 4) Optional: write a record to Firestore for auditing
  await admin.firestore().collection('role_audit').add({
    targetUid: user.uid,
    targetEmail: user.email,
    role,
    by: callerEmail,
    at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, uid: user.uid, email: user.email, claims };
});

