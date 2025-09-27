// =============================================
// FILE: src/pages/people/Musicians.tsx
// Public page: Musicians only
// =============================================
import React from 'react';
import PersonCard from '../../components/PersonCard';
import type { Person } from '../../components/PersonCard';
import './common.css';
import EnriqueImg from '../../assets/headshots/Enrique.jpg';
import BrandonImg from '../../assets/headshots/brandon.jpg';
import DayaImg from '../../assets/headshots/daya.jpg';

// TODO: Replace with Firestore query in a follow-up (collection: "people", role: "musician")
const MUSICIANS: Person[] = [
    {
        id: 'mus-1',
        name: 'Enrique Rodrigruez-Gonzales',
        category: 'musician',
        instrument: 'Vihuela',
        section: 'Armonia',
        headshotUrl: 'EnriqueImg'
      },
      {
        id: 'mus-2',
        name: 'Angel Ramirez',
        category: 'musician',
        instrument: 'Guitarron',
        section: 'Armonia',
        headshotUrl: 'https://via.placeholder.com/512x640?text=José+Hernández'
      },
      {
        id: 'mus-3',
        name: 'Brandon',
        category: 'musician',
        role: 'Guitarra',
        section: 'Armonia',
        headshotUrl: 'src/assets/headshots/brandon.jpg'
      },
      {
        id: 'mus-3',
        name: 'Paulina Perez',
        category: 'musician',
        role: 'Singer/Guitar',
        section: 'Armonia',
        headshotUrl: 'https://via.placeholder.com/512x640?text=Sofía+García'
      },
      {
        id: 'Mus-4',
        name: 'Gaby (guitar)',
        category: 'musician',
        role: 'Singer/Guitar',
        section: 'Armonia',
        headshotUrl: 'https://via.placeholder.com/512x640?text=Sofía+García'
      },
      {
        id: 'Mus-5',
        name: 'Dayanara Bravo',
        role: 'Violin-Guitarron',
        category: 'musician',
        section: 'String-Armonia',
        headshotUrl: 'src/assets/headshots/daya.jpg'
      },
      {
        id: 'Mus-6',
        name: 'Jake Sherry',
        category: 'musician',
        role: 'Trumpet',
        section: 'Trumpet',
        headshotUrl: 'https://via.placeholder.com/512x640?text=Sofía+García'
      },
      {
        id: 'mus-7',
        name: 'april',
        category: 'musician',
        role: 'Folklórico',
        section: 'Danza',
        headshotUrl: 'https://via.placeholder.com/512x640?text=Sofía+García'
      },
      {
        id: 'mus-8',
        name: 'Andrew',
        category: 'musician',
        role: 'Violin',
        section: 'string',
        headshotUrl: 'https://via.placeholder.com/512x640?text=Sofía+García'
      },
];

const Musicians: React.FC = () => {
  return (
    <section className="people-page">
      <header className="people-header">
        <h1>Our Musicians</h1>
        <p className="people-subtitle">Meet the student performers who bring the music to life.</p>
      </header>
      <div className="people-grid">
        {MUSICIANS.map(p => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>
    </section>
  );
};

export default Musicians;
