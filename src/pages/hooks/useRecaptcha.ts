// =============================================
// FILE: src/hooks/useRecaptcha.tsx
// Description: Lightweight hook for reCAPTCHA v3. Returns execute(action).
// Requires: VITE_RECAPTCHA_SITE_KEY in your env. If missing, returns a fake token.
// =============================================
import { useCallback, useEffect, useRef, useState } from 'react';

// load the v3 script once
function injectRecaptcha(siteKey: string) {
  const id = 'recaptcha-v3';
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.async = true;
  s.defer = true;
  s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
  document.head.appendChild(s);
}

export function useRecaptcha() {
  const [ready, setReady] = useState(false);
  const siteKeyRef = useRef<string | null>(
    typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY ?? null : null
  );

  useEffect(() => {
    if (!siteKeyRef.current) {
      // no key provided, we'll operate in dev mode
      setReady(true);
      return;
    }
    injectRecaptcha(siteKeyRef.current);

    const onLoad = () => setReady(true);
    // Ensure we mark ready once grecaptcha is defined
    const t = window.setInterval(() => {
      if ((window as any).grecaptcha?.execute) {
        window.clearInterval(t);
        onLoad();
      }
    }, 100);
    return () => window.clearInterval(t);
  }, []);

  const execute = useCallback(async (action: string) => {
    // Dev fallback when no site key configured
    if (!siteKeyRef.current) return `dev_${action}_${Date.now()}`;
    const grecaptcha = (window as any).grecaptcha;
    if (!grecaptcha || !grecaptcha.execute) throw new Error('reCAPTCHA not ready');
    const token: string = await grecaptcha.execute(siteKeyRef.current, { action });
    return token;
  }, []);

  return { ready, execute } as const;
}
