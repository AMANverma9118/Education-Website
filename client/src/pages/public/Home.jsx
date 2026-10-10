import { Link, Navigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import PremiumHero from '../../components/home/PremiumHero.jsx';
import HorizontalGallery from '../../components/home/HorizontalGallery.jsx';
import HorizontalRoles from '../../components/home/HorizontalRoles.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Home.css';

export default function Home() {
  const { user, homePath, loading } = useAuth();

  if (loading) {
    return (
      <div className="route-loading" aria-busy="true">
        Loading…
      </div>
    );
  }

  // Signed-in users stay in their portal — not the public hero
  if (user) {
    return <Navigate to={homePath} replace />;
  }

  return (
    <div className="home">
      <PremiumHero />
      <HorizontalGallery />
      <HorizontalRoles />

      <section className="home-strip">
        <div className="home-strip__inner">
          <h2>Ready when the school day starts.</h2>
          <Link to="/signup">
            <Button variant="clay">Join the school</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
