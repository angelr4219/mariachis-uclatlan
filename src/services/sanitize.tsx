

// ===============================
// 5) Client‑side sanitization helpers
// File: src/services/sanitize.tsx
// ===============================
export const stripHTML = (s: string): string => s.replace(/<[^>]*>/g, '');


export const sanitizeMessage = (s: string, max = 2000): string => {
const noScripts = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
const noTags = stripHTML(noScripts);
return noTags.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max).trim();
};


export const cleanPhone = (s: string): string => s.replace(/[^+\d]/g, '');


export const isValidPhoneE164 = (s: string): boolean => /^\+[1-9]\d{7,14}$/.test(s);

