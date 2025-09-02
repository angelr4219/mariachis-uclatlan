
// ================================
// FILE: src/hooks/useRecaptcha.ts
// Desc: Minimal hook wrapping grecaptcha v3/enterprise execute
// ================================
import { useCallback } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY; // must be defined

declare global {
  interface Window { grecaptcha?: any }
}

export function useRecaptcha() {
  const execute = useCallback(async (action: string): Promise<string | null> => {
    if (!SITE_KEY) return null;
    // Ensure grecaptcha loaded
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha || !grecaptcha.execute) return null;
    try {
      const token = await grecaptcha.execute(SITE_KEY, { action });
      return token as string;
    } catch (e) {
      console.error('reCAPTCHA execute failed', e);
      return null;
    }
  }, []);

  return { execute };
}

