// src/components/carousel/carousel.tsx
import { useState } from 'react';
import './Carousel.css';

import img1 from '../../assets/IMG_1055.jpg';
import img2 from '../../assets/inauguration.jpg';  // check the actual name
import img3 from '../../assets/juliofrenk.jpg';
     // <-- this one
// import img5 from '../../assets/mdu-logo.png';    // if you’re using it

const images = [img1, img2, img3];

export default function Carousel() {
  const [i, setI] = useState(0);
  return (
    <div className="carousel">
      <button className="carousel-button prev" onClick={() => setI((i - 1 + images.length) % images.length)}>‹</button>
      <img className="carousel-image" src={images[i]} alt={`Slide ${i + 1}`} />
      <button className="carousel-button next" onClick={() => setI((i + 1) % images.length)}>›</button>
    </div>
  );
}
