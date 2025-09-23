

// =============================================
// FILE: src/pages/Home/Home.tsx
// Purpose: Example page showing responsive cards + grid
// =============================================

import React from 'react';
import './Home.css';
import Carousel from '../components/carousel/carousel';
const Home: React.FC = () => {
  return (
    <section className="home stack">
      <header className="stack">
        <h1 className="title">Welcome</h1>
        <p className="lede">Responsive layout tuned for iPhone, iPad, Android, and desktop.</p>
      </header>

      <div className="grid cols-3 stack-md">
        <article className="card">
          <h3>Events</h3>
          <p>See upcoming performances and details.</p>
        </article>
        <article className="card">
          <h3>Members</h3>
          <p>Register, update profile, and set availability.</p>
        </article>
        <article className="card">
          <h3>About</h3>
          <p>Learn about Mariachi de Uclatlán.</p>
        </article>
      </div>
      <Carousel />
    </section>
  );
};

export default Home;


