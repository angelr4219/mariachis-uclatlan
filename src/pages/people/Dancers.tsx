
// =============================================
// FILE: src/pages/people/Dancers.tsx
// Public page: Dancers only (Folklórico)
// =============================================
import React from 'react';
import PersonCard from '../../components/PersonCard';
import type { Person } from '../../components/PersonCard';
import './common.css';

// TODO: Replace with Firestore query in a follow-up (collection: "people", role: "dancer")
const DANCERS: Person[] = [
    {
        id: 'dan-1',
        name: 'Sarah Ward',
        category: 'musician',
        role: 'Folklórico',
        section: 'Danza',
        headshotUrl: 'https://via.placeholder.com/512x640?text=Sofía+García'
      }, 
];

const Dancers: React.FC = () => {
  return (
    <section className="people-page">
      <header className="people-header">
        <h1>Our Dancers</h1>
        <p className="people-subtitle">Folklórico dancers who bring motion and storytelling to our performances.</p>
      </header>
      <div className="people-grid">
        {DANCERS.map(p => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>
    </section>
  );
};

export default Dancers;
