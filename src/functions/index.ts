// functions/src/index.ts
import { getAuth } from "firebase-admin/auth";
import { onUpdate } from "firebase-functions/v2/firestore";

export const syncUserRole = onUpdate(
  "users/{uid}",
  async (event) => {
    const afterData = event.data?.after?.data();
    if (!afterData) return;
    const uid = event.params.uid;
    const role = afterData.role;

    const claims: Record<string, boolean> = {};
    if (role === "admin") claims.admin = true;
    // You can add more roles as flags if needed
    await getAuth().setCustomUserClaims(uid, claims);
  }
);