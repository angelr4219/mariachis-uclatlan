// src/components/Footer.tsx
import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer compact-footer">
      <p>&copy; {new Date().getFullYear()} Mariachi de Uclatlán.</p>
      <p>Developed by Angel Ramirez | <a href="/contact">Contact</a></p>
    </footer>
  );
};

export default Footer;
