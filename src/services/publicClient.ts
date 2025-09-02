

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

