import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './PublicNavbar.css';

export default function PublicNavbar() {
  const { user, homePath, logout, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`lux-nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="lux-nav__bar">
        <Link
          to={isAuthenticated ? homePath : '/'}
          className="lux-nav__brand"
          onClick={() => setOpen(false)}
        >
          <span className="lux-nav__mono" aria-hidden="true">
            GA
          </span>
          <span className="lux-nav__name">
            Greenfield
            <em>Academy</em>
          </span>
        </Link>

        <nav className="lux-nav__links" aria-label="Primary">
          {isAuthenticated ? (
            <NavLink to={homePath} end onClick={() => setOpen(false)}>
              Portal
            </NavLink>
          ) : (
            <NavLink to="/" end onClick={() => setOpen(false)}>
              Home
            </NavLink>
          )}
          <NavLink to="/about" onClick={() => setOpen(false)}>
            About
          </NavLink>
          <NavLink to="/contact" onClick={() => setOpen(false)}>
            Contact
          </NavLink>
        </nav>

        <div className="lux-nav__actions">
          {user ? (
            <>
              <Link to={homePath} className="lux-nav__ghost" onClick={() => setOpen(false)}>
                Portal
              </Link>
              <button type="button" className="lux-nav__ghost" onClick={() => logout()}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="lux-nav__ghost" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link to="/signup" className="lux-nav__cta" onClick={() => setOpen(false)}>
                Enrol
              </Link>
            </>
          )}
        </div>

        <button
          className="lux-nav__toggle"
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      <div className={`lux-nav__drawer ${open ? 'is-open' : ''}`}>
        {isAuthenticated ? (
          <NavLink to={homePath} end onClick={() => setOpen(false)}>
            Portal
          </NavLink>
        ) : (
          <NavLink to="/" end onClick={() => setOpen(false)}>
            Home
          </NavLink>
        )}
        <NavLink to="/about" onClick={() => setOpen(false)}>
          About
        </NavLink>
        <NavLink to="/contact" onClick={() => setOpen(false)}>
          Contact
        </NavLink>
        {user ? (
          <>
            <Link to={homePath} onClick={() => setOpen(false)}>
              Portal
            </Link>
            <button type="button" onClick={() => logout()}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link to="/signup" className="lux-nav__cta" onClick={() => setOpen(false)}>
              Enrol
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
