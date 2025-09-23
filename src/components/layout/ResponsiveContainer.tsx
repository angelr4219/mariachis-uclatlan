
// =============================================
// FILE: src/components/layout/ResponsiveContainer.tsx
// Purpose: Page wrapper providing consistent paddings + SEO-ready landmarks
// =============================================
import React from 'react';
import AppHeader from './AppHeader';
import './ResponsiveContainer.css';

const ResponsiveContainer: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="container main stack" role="main">
        {children}
      </main>
      <footer className="app-footer" role="contentinfo">
        <div className="container foot">
          <p>© {new Date().getFullYear()} Mariachi de Uclatlán</p>
        </div>
      </footer>
    </div>
  );
};

export default ResponsiveContainer;

