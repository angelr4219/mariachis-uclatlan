
// src/components/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="nav-brand">Mariachi de Uclatlán</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/members">Members</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        <li><Link to="/Login">Login</Link></li>
        <li><Link to="/Register">Register</Link></li>
        
        
     { /*
        <li><Link to="/musicians">Musicians</Link></li>
        <li><Link to="/dancers">Dancers</Link></li>
        <li><Link to="/staff">Staff</Link></li>
      */
     }  
        
      </ul>
    </nav>
  );
};

export default Navbar;