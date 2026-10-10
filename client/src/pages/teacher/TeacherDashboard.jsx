import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './TeacherPortal.css';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/teacher/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <p className="empty">Loading teacher overview…</p>;

  const subjects = user?.subjects?.length ? user.subjects.join(' · ') : 'Faculty';

  return (
    <div className="portal portal--teacher">
      <header className="teacher-hero">
        <div>
          <p className="portal__eyebrow">Faculty desk</p>
          <h1 className="page-title">Good day, {user.firstName}</h1>
          <p className="page-sub">
            {subjects}. Manage attendance and grades for your assigned classes.
          </p>
        </div>
        <div className="teacher-hero__actions">
          <Link to="/teacher/classes">
            <Button variant="clay">Take attendance</Button>
          </Link>
          <Link to="/teacher/grades">
            <Button variant="secondary">Record a grade</Button>
          </Link>
        </div>
      </header>

      <div className="stat-row teacher-stats">
        <div className="stat">
          <p className="stat__value">{data.classCount}</p>
          <p className="stat__label">Classes assigned</p>
        </div>
        <div className="stat">
          <p className="stat__value">{data.studentCount}</p>
          <p className="stat__label">Students in your care</p>
        </div>
      </div>

      <section className="panel teacher-roster">
        <div className="panel__head">
          <h2 className="panel__title">Your classes</h2>
          <Link to="/teacher/classes" className="panel__link">
            Open class tools
          </Link>
        </div>

        {data.classes.length === 0 ? (
          <p className="empty">No classes assigned yet. The principal can assign you.</p>
        ) : (
          <div className="teacher-class-grid">
            {data.classes.map((c) => (
              <article key={c._id} className="teacher-class">
                <p className="teacher-class__meta">
                  Grade {c.gradeLevel}
                  {c.section ? ` · ${c.section}` : ''}
                </p>
                <h3>{c.name}</h3>
                <p className="teacher-class__count">
                  {c.students?.length || 0} student{(c.students?.length || 0) === 1 ? '' : 's'}
                </p>
                {c.students?.length > 0 && (
                  <ul className="teacher-class__names">
                    {c.students.slice(0, 4).map((s) => (
                      <li key={s._id || s.id}>
                        {s.firstName} {s.lastName}
                      </li>
                    ))}
                    {c.students.length > 4 && (
                      <li className="teacher-class__more">+{c.students.length - 4} more</li>
                    )}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
