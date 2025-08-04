import React, { useState } from 'react';
import './Carousel.css'; // Style it

const images = [
  '/images/performance1.jpg',
  '/images/performance2.jpg',
  '/images/rehearsal.jpg',
  '/images/danza.jpg'
];

const Carousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="carousel">
      <button className="carousel-button prev" onClick={prevSlide}>‹</button>
      <img src={images[currentIndex]} alt={`Slide ${currentIndex + 1}`} className="carousel-image" />
      <button className="carousel-button next" onClick={nextSlide}>›</button>
    </div>
  );
};

export default Carousel;
