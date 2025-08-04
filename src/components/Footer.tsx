// src/components/Footer.tsx
import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Mariachi de Uclatlán. All rights reserved.</p>
        <p>
          Designed and developed by <strong>Angel Ramirez</strong>, member of Mariachi de Uclatlán and web developer passionate about preserving Mexican musical heritage.
        </p>
        
        <p>
          Follow us on:
          <a href="https://www.facebook.com/Uclatlan" target="_blank" rel="noopener noreferrer"> Facebook</a> | 
          <a href="https://www.instagram.com/Uclatlan" target="_blank" rel="noopener noreferrer"> Instagram</a> | 
          <a href="https://www.youtube.com/Uclatlan" target="_blank" rel="noopener noreferrer"> YouTube</a>
        </p>
        <p>
          <a href="/contact">Contact Us</a> | 
          <a href="/about"> About</a> | 
          <a href="/members"> Meet Our Members</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
