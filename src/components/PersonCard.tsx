// =============================================
// FILE: src/components/people/PersonCard.tsx
// Hardcoded people cards (manually add entries here)
// =============================================
import React from 'react';
import './PersonCard.css';

export type PersonCategory = 'staff' | 'musician' | 'dancer';


export type Person = {
id: string;
name: string;
category: PersonCategory; // ← explicit grouping
role?: string; // e.g., Director, Coordinator, Folklórico
instrument?: string; // e.g., Violin, Guitarrón (for musicians)
section?: string; // e.g., Strings, Brass, Danza
headshotUrl?: string; // direct image URL
};

// Hardcoded list of people (manually add as needed)
export const PEOPLE: Person[] = [
  {
    id: 'staff-1',
    name: 'Jesús Guzmán',
    category: 'staff',
    role: 'Director',
    headshotUrl: 'https://via.placeholder.com/512x640?text=Jesús+Guzmán'
  },
  {
    id: 'staff-2',
    name: 'Elias Rodriguez',
    category: 'staff',
    role: 'Program Coordinator',
    headshotUrl: 'https://via.placeholder.com/512x640?text=María+López'
  },
  {
    id: 'mus-1',
    name: 'Enrique Rodrigruez-Gonzales',
    category: 'musician',
    instrument: 'Vihuela',
    section: 'Armonia',
    headshotUrl: 'https://via.placeholder.com/512x640?text=Andrea+Martínez'
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
    headshotUrl: 'https://via.placeholder.com/512x640?text=Sofía+García'
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
    headshotUrl: 'https://via.placeholder.com/512x640?text=Sofía+García'
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
  },{
    id: 'dan-1',
    name: 'Sarah Ward',
    category: 'musician',
    role: 'Folklórico',
    section: 'Danza',
    headshotUrl: 'https://via.placeholder.com/512x640?text=Sofía+García'
  },

];




// A single card component (renders one person)
interface Props {
    person: Person;
    }
    
    
    const PersonCard: React.FC<Props> = ({ person }) => {
    return (
    <article className="person-card" aria-label={person.name}>
    <div className="person-card__image">
    <img
    src={person.headshotUrl || 'https://via.placeholder.com/512x640?text=Headshot'}
    alt={`${person.name} headshot`}
    loading="lazy"
    />
    </div>
    <div className="person-card__body">
    <h3 className="person-card__name">{person.name}</h3>
    {person.role && <p className="person-card__meta">{person.role}</p>}
    {person.instrument && (
    <p className="person-card__meta"><strong>Instrument:</strong> {person.instrument}</p>
    )}
    {person.section && (
    <p className="person-card__meta"><strong>Section:</strong> {person.section}</p>
    )}
    </div>
    </article>
    );
    };
    
    
    export default PersonCard;