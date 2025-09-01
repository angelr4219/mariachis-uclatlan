// src/hooks/useRecaptcha.ts
import { useCallback } from 'react';


declare global {
interface Window {
grecaptcha?: any;
}
}


function injectScript(siteKey: string): Promise<void> {
return new Promise((resolve, reject) => {
if (window.grecaptcha) return resolve();
const s = document.createElement('script');
s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
s.async = true;
s.defer = true;
s.onload = () => resolve();
s.onerror = () => reject(new Error('reCAPTCHA failed to load'));
document.head.appendChild(s);
});
}


export function useRecaptcha(siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string) {
const execute = useCallback(async (action: string) => {
if (!siteKey) throw new Error('Missing VITE_RECAPTCHA_SITE_KEY');
await injectScript(siteKey);
return new Promise<string>((resolve, reject) => {
if (!window.grecaptcha) return reject(new Error('grecaptcha unavailable'));
window.grecaptcha.ready(() => {
window.grecaptcha.execute(siteKey, { action }).then(resolve).catch(reject);
});
});
}, [siteKey]);


return { execute };
}