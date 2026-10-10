import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ROLES = [
  {
    title: 'Students',
    text: 'Register first, then share your family link code so a parent can connect.',
    src: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1600&q=85',
  },
  {
    title: 'Parents',
    text: 'Link with your child’s email and code to see grades and attendance.',
    src: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1600&q=85',
  },
  {
    title: 'Teachers',
    text: 'Log in with credentials from the principal — then mark attendance and grades.',
    src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=85',
  },
  {
    title: 'Principal',
    text: 'Create teacher accounts, approve families, and publish school updates.',
    src: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=85',
  },
];

/** Full-page horizontal role panels with campus photography. */
export default function HorizontalRoles() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const getScroll = () => Math.max(track.scrollWidth - window.innerWidth, 0);
      if (reduced) return;

      gsap.to(track, {
        x: () => -getScroll(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScroll()}`,
          pin: true,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="roles-scroll" ref={sectionRef} aria-label="Who it’s for">
      <div className="roles-scroll__intro">
        <p className="roles-scroll__eyebrow">The portal</p>
        <h2>Built for everyone on campus</h2>
      </div>
      <div className="roles-scroll__track" ref={trackRef}>
        {ROLES.map((role, i) => (
          <article key={role.title} className="role-card">
            <div
              className="role-card__media"
              style={{ backgroundImage: `url('${role.src}')` }}
              aria-hidden="true"
            />
            <div className="role-card__wash" aria-hidden="true" />
            <div className="role-card__copy">
              <p className="role-card__index">{String(i + 1).padStart(2, '0')}</p>
              <h3>{role.title}</h3>
              <p>{role.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
