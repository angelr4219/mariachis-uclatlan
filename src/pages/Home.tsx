// =============================================
// FILE: src/pages/Home/Home.tsx
// Purpose: Intro welcome layout + carousel + quick links
// =============================================

import React from 'react';
import './Home.css';
import Carousel from '../components/carousel/carousel';

const Home: React.FC = () => {
  return (
    <section className="home stack">
      <header className="welcome">
        <h1>Welcome to Mariachi de Uclatlán</h1>
        <p>
          Mariachi de Uclatlán is a student-led musical ensemble at UCLA dedicated to
          preserving, celebrating, and innovating the traditions of mariachi music. Our
          group provides students from diverse academic and cultural backgrounds with the
          opportunity to share the beauty of this art form with the UCLA community and
          beyond.
        </p>
        <p>
          As part of our mission, we honor the roots of Mexican music while bringing it
          into contemporary spaces. From classrooms to grand stages, Mariachi de Uclatlán
          fosters a spirit of community, cultural pride, and artistic excellence. Our
          members balance their roles as students and performers, keeping alive the
          traditions passed down through generations.
        </p>
        <p>
          Alongside our musicians, we are proud to collaborate with UCLA’s Ballet
          Folklórico, whose dancers bring vibrant movement and color to our performances.
          Together, music and dance tell stories that embody the energy and passion of
          Mexican culture, creating a complete and unforgettable experience for audiences.
        </p>
        <p>
          Founded in 1961, Mariachi de Uclatlán holds the distinction of being one of the
          first collegiate mariachi ensembles in the United States. Over six decades, we
          have built a legacy of performances, community outreach, and cultural
          preservation. We continue to grow as a family of students dedicated to sharing
          this living tradition with future generations. ¡Viva el mariachi!
        </p>
      </header>

      {/* Responsive grid with quick links */}
   

      <Carousel />
    </section>
  );
};

export default Home;

