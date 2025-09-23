// =============================================
// FILE: src/hooks/useViewport.ts
// Purpose: SSR-safe viewport hook with iPadOS detection + resize/orientation listeners
// =============================================
import { useEffect, useMemo, useState } from 'react';

export type Viewport = {
  width: number;
  height: number;
  isMobile: boolean;      // <768
  isTablet: boolean;      // 768–1023
  isDesktop: boolean;     // >=1024
  os: 'ios' | 'android' | 'other';
};

const DEFAULT: Viewport = {
  width: 0,
  height: 0,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  os: 'other',
};

function detectOS(): Viewport['os'] {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || (navigator as any).vendor || '';
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = !iOSUA && navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1;
  if (iOSUA || iPadOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

function readViewport(): Viewport {
  if (typeof window === 'undefined') return DEFAULT;
  const w = Math.max(0, window.innerWidth || 0);
  const h = Math.max(0, window.innerHeight || 0);
  return {
    width: w,
    height: h,
    isMobile: w < 768,
    isTablet: w >= 768 && w < 1024,
    isDesktop: w >= 1024,
    os: detectOS(),
  };
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(() => DEFAULT);

  // Compute once on client mount (avoids SSR hydration mismatch)
  useEffect(() => {
    setVp(readViewport());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let frame: number | null = null;
    const onResize = () => {
      if (frame != null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVp(readViewport()));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, []);

  return useMemo(() => vp, [vp]);
}
