import './SimplePage.css';

export default function About() {
  return (
    <div className="simple-page">
      <div className="simple-page__hero">
        <div className="container">
          <p className="eyebrow">About</p>
          <h1>A school that still feels like a place, not a product.</h1>
        </div>
      </div>
      <div className="container simple-page__body">
        <p>
          Greenfield Academy serves families across Brookhaven with steady academics, outdoor
          learning, and a staff that knows students by name. This portal keeps daily school life
          organized — without turning it into another noisy app.
        </p>
        <p>
          The principal reviews new accounts, teachers own their classrooms, and parents can see
          what matters without digging through email chains.
        </p>
      </div>
    </div>
  );
}
