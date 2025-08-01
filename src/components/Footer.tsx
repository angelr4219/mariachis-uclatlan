
// src/components/Footer.tsx
import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Mariachi de Uclatlán. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
