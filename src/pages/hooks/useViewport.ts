
// =============================================
// FILE: src/hooks/useViewport.ts
// Purpose: Hook to read viewport size + flags
// =============================================
import { useEffect, useState } from 'react';

type Viewport = {
  width: number;
  height: number;
  isMobile: boolean;      // <768
  isTablet: boolean;      // 768–1023
  isDesktop: boolean;     // >=1024
  os: 'ios' | 'android' | 'other';
};

export function useViewport(): Viewport {
  const getOS = (): Viewport['os'] => {
    const ua = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'other';
  };

  const get = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      width: w,
      height: h,
      isMobile: w < 768,
      isTablet: w >= 768 && w < 1024,
      isDesktop: w >= 1024,
      os: getOS(),
    } as const;
  };

  const [vp, setVp] = useState<Viewport>(get());

  useEffect(() => {
    const onResize = () => setVp(get());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return vp;
}

