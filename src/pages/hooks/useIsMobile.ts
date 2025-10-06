// =============================================
// FILE: src/hooks/useIsMobile.tsx
// Purpose: Tiny responsive hook that answers "is this viewport mobile?"
// - Uses window.matchMedia with SSR guards
// - You can pass either a full media query string or a number (px)
// - Defaults to 960px max-width, matching your Reports.css breakpoint
// =============================================
import * as React from 'react';

/**
 * useIsMobile
 * @param mqOrPx Either a media query string (e.g. '(max-width: 960px)')
 *               or a number representing the max width in px (e.g. 960).
 */
export function useIsMobile(mqOrPx: string | number = 960) {
  const query = typeof mqOrPx === 'number' ? `(max-width: ${mqOrPx}px)` : mqOrPx;
  const getMatch = () => (typeof window !== 'undefined' && 'matchMedia' in window)
    ? window.matchMedia(query).matches
    : false; // SSR / non-browser default

  const [isMobile, setIsMobile] = React.useState<boolean>(getMatch);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;
    const mql = window.matchMedia(query);

    // Set on mount in case of hydration diff
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Modern browsers
    mql.addEventListener?.('change', handler);
    // Fallback (older Safari)
    // @ts-ignore - addListener is deprecated but present in older engines
    mql.addListener?.(handler);

    return () => {
      mql.removeEventListener?.('change', handler);
      // @ts-ignore
      mql.removeListener?.(handler);
    };
  }, [query]);

  return isMobile;
}