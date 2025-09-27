

// =============================================
// FILE: src/pages/people/Staff.tsx
// Public page: Staff only (hardcoded list, mirrors your Musicians.tsx pattern)
// =============================================
import React from 'react';
// If your PersonCard lives at components/people/PersonCard, update the path accordingly
import PersonCard from '../../components/PersonCard';
import type { Person } from '../../components/PersonCard';
import './common.css';


// Hardcoded staff entries (edit freely)
const STAFF: Person[] = [
{
id: 'staff-1',
name: 'Jesús Guzmán',
category: 'staff',
role: 'Director',
headshotUrl: '../../assets/headshots/Chuy.png'
},
{
id: 'staff-2',
name: 'Elias Rodriguez',
category: 'staff',
role: 'Program Coordinator',
headshotUrl: 'https://via.placeholder.com/512x640?text=Elias+Rodriguez'
},

];


const Staff: React.FC = () => {
return (
<section className="people-page">
<header className="people-header">
<h1>Our Staff</h1>
<p className="people-subtitle">Leaders and coordinators supporting Mariachi de Uclatlán.</p>
</header>
<div className="people-grid">
{STAFF.map(p => (
<PersonCard key={p.id} person={p} />
))}
</div>
</section>
);
};


export default Staff;