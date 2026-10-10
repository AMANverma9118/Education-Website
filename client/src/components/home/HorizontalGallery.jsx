import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PANELS = [
  {
    src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=85',
    title: 'Campus halls',
    text: 'Quiet paths between busy days.',
  },
  {
    src: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=2000&q=85',
    title: 'The library',
    text: 'Where curiosity finds a seat.',
  },
  {
    src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=2000&q=85',
    title: 'In class',
    text: 'Learning that stays close to home.',
  },
  {
    src: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=2000&q=85',
    title: 'After the bell',
    text: 'Friends, fields, and the walk home.',
  },
  {
    src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=2000&q=85',
    title: 'Ready rooms',
    text: 'Space to think, ask, and grow.',
  },
];

/**
 * Full-page horizontal scroll — cards move sideways as you scroll down.
 */
export default function HorizontalGallery() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const getScroll = () => Math.max(track.scrollWidth - window.innerWidth, 0);

      if (reduced) {
        gsap.set(track, { x: 0 });
        return;
      }

      gsap.to(track, {
        x: () => -getScroll(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScroll()}`,
          pin: true,
          scrub: 0.9,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="h-scroll" ref={sectionRef} aria-label="Campus gallery">
      <div className="h-scroll__track" ref={trackRef}>
        {PANELS.map((panel, i) => (
          <article key={panel.title} className="h-card">
            <div
              className="h-card__media"
              style={{ backgroundImage: `url('${panel.src}')` }}
              aria-hidden="true"
            />
            <div className="h-card__wash" aria-hidden="true" />
            <div className="h-card__copy">
              <p className="h-card__index">{String(i + 1).padStart(2, '0')}</p>
              <h2>{panel.title}</h2>
              <p>{panel.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
