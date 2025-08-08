// src/pages/Home.tsx
import React from 'react';
import Carousel from '../components/carousel/carousel';

const Home: React.FC = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto', lineHeight: 1.6 }}>
      <h1>Mariachi de Uclatlán</h1>
      <p>
        Welcome to Mariachi de Uclatlán — UCLA's premier mariachi ensemble dedicated to
        preserving and celebrating the vibrant traditions of Mexican music and culture.
        Founded in 1961, Mariachi de Uclatlán stands as the first collegiate mariachi
        group in the United States, pioneering the integration of mariachi into academic
        programs and performance art.
      </p>
      <p>
        Our ensemble is composed of passionate student musicians and dancers who are
        committed to honoring the heritage of mariachi while continuously evolving with
        modern influences. Through spirited performances, cultural outreach, and educational
        initiatives, we strive to keep the heart of mariachi alive for future generations.
      </p>
      <p>
        Whether you are a musician, a fan of traditional Mexican music, or someone looking
        to connect with a vibrant community, we invite you to join us on this journey.
        Explore our history, meet our talented members, and experience the soulful melodies
        that define Mariachi de Uclatlán.
      </p>

      {/* 👉 New Carousel here */}
      <Carousel />

      <p>¡Viva el mariachi!</p>
    </div>
  );
};

export default Home;
