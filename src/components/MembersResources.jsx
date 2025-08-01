// src/pages/MembersResources.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './MembersOnly.css';

function MembersResources() {
    return (
        <section className="ucla-content" style={{ padding: '2rem' }}>
          <h1 className="ucla-heading-xl" style={{ color: '#FFD100' }}>
            🎼 Sheet Music Library
          </h1>
          <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            Access PDF sheet music for each instrument section.
          </p>
          <a
            href="https://ucla.box.com/v/mariachi-sheet-music"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: '#2774AE',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 'bold',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            Open Sheet Music Library →
          </a>
        </section>
      );
}

export default MembersResources;
