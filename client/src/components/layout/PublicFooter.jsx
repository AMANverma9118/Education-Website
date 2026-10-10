import { Link } from 'react-router-dom';
import './PublicFooter.css';

export default function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="container pub-footer__grid">
        <div>
          <p className="pub-footer__brand">Greenfield Academy</p>
          <p className="pub-footer__tag">
            A neighborhood school where families, teachers, and students stay connected.
          </p>
        </div>
        <div>
          <p className="pub-footer__label">Visit</p>
          <p>482 Maple Ridge Road</p>
          <p>Brookhaven, OR 97302</p>
        </div>
        <div>
          <p className="pub-footer__label">Portal</p>
          <Link to="/login">Sign in</Link>
          <Link to="/signup">Create account</Link>
          <Link to="/contact">Contact office</Link>
        </div>
      </div>
      <div className="container pub-footer__bar">
        <span>© {new Date().getFullYear()} Greenfield Academy</span>
      </div>
    </footer>
  );
}
