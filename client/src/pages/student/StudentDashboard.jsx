import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './StudentPortal.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get('/student/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <p className="empty">Loading your overview…</p>;

  const { profile } = data;

  async function copyCode() {
    if (!profile.familyLinkCode) return;
    try {
      await navigator.clipboard.writeText(profile.familyLinkCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="portal portal--student">
      <header className="student-hero">
        <p className="portal__eyebrow">Student portal</p>
        <h1 className="page-title">Hello, {user.firstName}</h1>
        <p className="page-sub">
          Grade {profile.gradeLevel || '—'}
          {profile.section ? ` · Section ${profile.section}` : ''}
          {' — '}your grades, attendance, and family link live here.
        </p>
      </header>

      <div className="student-layout">
        <aside className="student-pass">
          <p className="student-pass__label">Family link pass</p>
          <p className="student-pass__hint">
            Give your parent this email and code so they can register and see your progress.
          </p>
          <p className="student-pass__email">{profile.email}</p>
          <p className="student-pass__code">{profile.familyLinkCode || '—'}</p>
          <button type="button" className="student-pass__copy" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy code'}
          </button>
          {!profile.isApproved && (
            <p className="student-pass__note">
              Parents can link after the principal approves your account.
            </p>
          )}
        </aside>

        <div className="student-main">
          <div className="stat-row student-stats">
            <div className="stat">
              <p className="stat__value">
                {data.attendanceRate ?? '—'}
                {data.attendanceRate != null ? '%' : ''}
              </p>
              <p className="stat__label">Recent attendance</p>
            </div>
            <div className="stat">
              <p className="stat__value">{data.recentGrades.length}</p>
              <p className="stat__label">Recent grades</p>
            </div>
          </div>

          <div className="student-quick">
            <Link to="/student/grades">
              <Button variant="secondary">View all grades</Button>
            </Link>
            <Link to="/student/attendance">
              <Button variant="ghost">Attendance record</Button>
            </Link>
          </div>

          <section className="panel">
            <h2 className="panel__title">Recent grades</h2>
            {data.recentGrades.length === 0 ? (
              <p className="empty">No grades posted yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Title</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentGrades.map((g) => (
                    <tr key={g._id}>
                      <td>{g.subject}</td>
                      <td>{g.title}</td>
                      <td>
                        {g.score}/{g.maxScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel">
            <h2 className="panel__title">School notices</h2>
            {data.announcements.length === 0 ? (
              <p className="empty">No announcements right now.</p>
            ) : (
              data.announcements.map((a) => (
                <article key={a._id} className="portal__announce">
                  <strong>{a.title}</strong>
                  <p>{a.body}</p>
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
