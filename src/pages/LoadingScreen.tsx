
// =============================================
// FILE: src/components/LoadingScreen.tsx
// Small center spinner so auth/roles can resolve
// =============================================
import React from 'react';

const LoadingScreen: React.FC = () => (
  <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
    <div role="status" aria-live="polite">Loading…</div>
  </div>
);

export default LoadingScreen;


