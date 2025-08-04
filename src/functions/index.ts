/*
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

exports.setUserRole = functions.https.onCall(async (data: { uid: string; role: string }, context: { auth: { token: { admin: boolean } } }) => {
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can assign roles');
  }

  const { uid, role } = data;

  let claims = {};
  if (role === 'admin') {
    claims = { admin: true };
  } else if (role === 'performer') {
    claims = { performer: true };
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'Role must be "admin" or "performer"');
  }

  await admin.auth().setCustomUserClaims(uid, claims);
  return { message: `Success! ${role} role has been assigned to user ${uid}.` };
});
*/