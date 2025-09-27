// src/components/carousel/Carousel.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Carousel.css';

import img1 from '../../assets/IMG_1055.jpg';
import img2 from '../../assets/inauguration.jpg';
import img3 from '../../assets/juliofrenk.jpg';
import img4 from '../../assets/brandonPhoto.jpg';
import img5 from '../../assets/rosebowl25.jpg'

// If you want to pass images in via props later, keep internal default as a fallback
const DEFAULT_IMAGES: string[] = [ img2, img3, img4, img5];

export type CarouselProps = {
  images?: string[];
  autoPlayMs?: number; // set to 0 to disable autoplay
  showIndicators?: boolean;
  aspectRatio?: `${number}/${number}`; // e.g. '16/9', '4/3'
  className?: string;
};

export default function Carousel({
  images = DEFAULT_IMAGES,
  autoPlayMs = 5000,
  showIndicators = true,
  aspectRatio = '16/9',
  className = '',
}: CarouselProps) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const hoverRef = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const count = images.length;

  const goTo = useCallback((next: number) => {
    setIndex(((next % count) + count) % count); // safe modulo
  }, [count]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  // Auto play with pause on hover & when page hidden
  useEffect(() => {
    if (!autoPlayMs) return; // disabled
    const start = () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (!hoverRef.current && !document.hidden) {
        timerRef.current = window.setInterval(() => {
          setIndex((i) => (i + 1) % count);
        }, autoPlayMs) as unknown as number;
      }
    };
    const stop = () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };

    start();
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', vis);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      stop();
    };
  }, [autoPlayMs, count]);

  // Touch/drag swipe support
  const onTouchStart: React.TouchEventHandler = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove: React.TouchEventHandler = (e) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    // apply transform for a subtle drag feedback
    if (trackRef.current) {
      const percent = (touchDeltaX.current / trackRef.current.clientWidth) * 100;
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translateX(calc(${-index * 100}% + ${percent}%))`;
    }
  };
  const onTouchEnd: React.TouchEventHandler = () => {
    if (trackRef.current) trackRef.current.style.transition = '';
    const delta = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    const threshold = 40; // px: minimal swipe to trigger
    if (Math.abs(delta) > threshold) {
      delta < 0 ? next() : prev();
    } else {
      // snap back
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${-index * 100}%)`;
      }
    }
  };

  const indicatorItems = useMemo(() => (
    images.map((_, i) => (
      <button
        key={i}
        aria-label={`Go to slide ${i + 1}`}
        className={`carousel-indicator ${i === index ? 'active' : ''}`}
        onClick={() => goTo(i)}
      />
    ))
  ), [images, index, goTo]);

  return (
    <div
      className={`carousel ${className}`}
      style={{ ['--carousel-aspect' as any]: aspectRatio }}
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
      aria-roledescription="carousel"
    >
      <div className="carousel-viewport" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div ref={trackRef} className="carousel-track" style={{ transform: `translateX(${-index * 100}%)` }}>
          {images.map((src, i) => (
            <div className="carousel-slide" key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
              <img className="carousel-image" src={src} loading="lazy" alt={`Slide ${i + 1}`} />
              <div className="carousel-gradient" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>

      <button className="carousel-button prev" onClick={prev} aria-label="Previous slide">‹</button>
      <button className="carousel-button next" onClick={next} aria-label="Next slide">›</button>

      {showIndicators && (
        <div className="carousel-indicators" role="tablist" aria-label="Slide indicators">
          {indicatorItems}
        </div>
      )}
    </div>
  );
}
