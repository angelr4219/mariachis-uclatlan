

// =============================================
// FILE: src/components/layout/StackOnMobile.tsx
// Purpose: Wrapper that applies the `stack` class when viewport is mobile.
// Example: <StackOnMobile className="grid cols-3"> ... </StackOnMobile>
// On mobile (<=960px), becomes: class="grid stack" (so it stacks)
// =============================================
import * as React from 'react';
import { useIsMobile } from '../pages/hooks/useIsMobile.ts';

type StackOnMobileProps = React.PropsWithChildren<{
  className?: string;
  /** Optional custom breakpoint; accepts query or px */
  mobile?: string | number;
}>;

export const StackOnMobile: React.FC<StackOnMobileProps> = ({ className = '', children, mobile = 960 }) => {
  const isMobile = useIsMobile(mobile);
  const classes = `${className} ${isMobile ? 'stack' : ''}`.trim();
  return <div className={classes}>{children}</div>;
};

