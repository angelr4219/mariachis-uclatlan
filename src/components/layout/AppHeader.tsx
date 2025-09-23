

// =============================================
// FILE: src/components/layout/AppHeader.tsx
// Purpose: Responsive header with safe-area padding + mobile menu
// =============================================
import React from 'react';
import './AppHeader.css';
import { Link } from 'react-router-dom';
import { useViewport } from '../../hooks/useViewport';

const AppHeader: React.FC = () => {
  const { isMobile } = useViewport();
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen(v => !v);
  const close = () => setOpen(false);

  return (
    <header className={`app-header ${open ? 'open' : ''}`}>
      <div className="container bar">
        <Link to="/" className="brand" onClick={close}>
          <span className="logo" aria-hidden>🎺</span>
          <span className="text">Uclatlán</span>
        </Link>
        <nav className="nav hide-on-mobile">
          <Link to="/" className="navlink">Home</Link>
          <Link to="/about" className="navlink">About</Link>
          <Link to="/events" className="navlink">Events</Link>
          <Link to="/members" className="navlink">Members</Link>
        </nav>
        <button className="menu-btn hide-on-desktop touch-target" aria-label="Menu" onClick={toggle}>
          <span className="hamburger"/>
        </button>
      </div>

      {isMobile && (
        <nav className="mobile-drawer hide-on-desktop" role="dialog" aria-modal="true">
          <Link to="/" onClick={close} className="item">Home</Link>
          <Link to="/about" onClick={close} className="item">About</Link>
          <Link to="/events" onClick={close} className="item">Events</Link>
          <Link to="/members" onClick={close} className="item">Members</Link>
        </nav>
      )}
    </header>
  );
};

export default AppHeader;

