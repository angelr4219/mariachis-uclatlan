import { useEffect, useRef } from 'react';


declare global {
interface Window { grecaptcha?: any }
}


export function useRecaptcha() {
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
const loadedRef = useRef(false);


useEffect(() => {
if (loadedRef.current || !siteKey) return;
const id = 'grecaptcha-script';
if (document.getElementById(id)) { loadedRef.current = true; return; }
const s = document.createElement('script');
s.id = id;
s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
s.async = true; s.defer = true;
s.onload = () => { loadedRef.current = true; };
document.head.appendChild(s);
}, [siteKey]);


async function execute(action: string): Promise<string> {
if (!siteKey || !window.grecaptcha) return '';
await new Promise<void>((resolve) => window.grecaptcha!.ready(() => resolve()));
const token = await window.grecaptcha!.execute(siteKey, { action });
return token;
}


return { execute };
}