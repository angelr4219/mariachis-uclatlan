// src/components/About.js

import './About.css';


function About() {
  return (
    <div className="about-page">


      <h1>About Us</h1>
      <p>
        Welcome to Mariachi de Uclatlán! We are UCLA's premier mariachi ensemble dedicated to 
        preserving the rich traditions of Mexican music and culture. Founded in 1961, our 
        ensemble has a long history of excellence and passion for mariachi music.
      </p>

      {/* Performance Video Section */}
      <h2>Watch a Recent Performance</h2>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: '2rem' }}>
        <iframe
          src="https://www.youtube.com/embed/PVT9JTaZokk?start=6720"
          title="Mariachi de Uclatlán Performance"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        ></iframe>
      </div>

      <h2>Our History</h2>
      <p>
        Mariachi de Uclatlán was established to provide students with an opportunity to 
        experience and perform traditional Mexican music while also promoting cultural 
        awareness. Over the years, we have participated in numerous events and competitions, 
        showcasing the talent and dedication of our members.
      </p>

      {/* ...rest of your content */}
    </div>
  );
}

export default About;
