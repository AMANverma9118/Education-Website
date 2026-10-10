import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Button from '../ui/Button.jsx';

/** Local asset — always available, no blank hero. */
const SCHOOL_IMG = '/school-hero.jpg';

/**
 * Full-page school hero with scroll zoom. No empty black panels.
 */
export default function PremiumHero() {
  const trackRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end start'],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 32, mass: 0.28 });

  const scale = useTransform(smooth, [0, 1], [1, 1.22]);
  const imgY = useTransform(smooth, [0, 1], ['0%', '12%']);
  const copyOpacity = useTransform(smooth, [0, 0.65], [1, 0]);
  const copyY = useTransform(smooth, [0, 1], [0, 70]);

  return (
    <section className="premium-hero" ref={trackRef}>
      <div className="premium-hero__sticky">
        <motion.div className="premium-hero__media" style={{ scale }}>
          <motion.img
            src={SCHOOL_IMG}
            alt="Greenfield Academy school building"
            className="premium-hero__img"
            style={{ y: imgY }}
            draggable={false}
          />
          <div className="premium-hero__wash" aria-hidden="true" />
        </motion.div>

        <motion.div
          className="premium-hero__copy"
          style={{ opacity: copyOpacity, y: copyY, x: '-50%' }}
        >
          <p className="premium-hero__eyebrow">Established Brookhaven</p>
          <h1 className="premium-hero__brand">Greenfield Academy</h1>
          <p className="premium-hero__title">Where learning stays close to home.</p>
          <p className="premium-hero__lede">
            One portal for students, parents, teachers, and the principal.
          </p>
          <div className="premium-hero__actions">
            <Link to="/signup">
              <Button variant="clay">Create an account</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="premium-hero__ghost">
                Sign in
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
