import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';

export default function PrincipalDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/principal/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <p className="empty">Loading school overview…</p>;

  const { stats, teachers = [], students = [], pendingUsers = [] } = data;

  return (
    <div className="portal portal--principal">
      <header className="portal__intro">
        <p className="portal__eyebrow">Head of school</p>
        <h1 className="page-title">Principal overview</h1>
        <p className="page-sub">School-wide snapshot, roster, and pending approvals.</p>
      </header>

      <div className="stat-row">
        <div className="stat">
          <p className="stat__value">{stats.students}</p>
          <p className="stat__label">Students</p>
        </div>
        <div className="stat">
          <p className="stat__value">{stats.teachers}</p>
          <p className="stat__label">Teachers</p>
        </div>
        <div className="stat">
          <p className="stat__value">{stats.parents}</p>
          <p className="stat__label">Parents</p>
        </div>
        <div className="stat">
          <p className="stat__value">{stats.pending}</p>
          <p className="stat__label">Pending approval</p>
        </div>
        <div className="stat">
          <p className="stat__value">{stats.classes}</p>
          <p className="stat__label">Classes</p>
        </div>
      </div>

      <div className="portal__actions">
        <Link to="/principal/users?view=student">
          <Button variant="primary">View students</Button>
        </Link>
        <Link to="/principal/users?view=teacher">
          <Button variant="secondary">Manage people</Button>
        </Link>
        <Link to="/principal/classes">
          <Button variant="ghost">Manage classes</Button>
        </Link>
        <Link to="/principal/announcements">
          <Button variant="ghost">Post announcement</Button>
        </Link>
      </div>

      <div className="portal__split">
        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Students</h2>
            <Link to="/principal/users?view=student" className="panel__link">
              All students
            </Link>
          </div>
          {students.length === 0 ? (
            <p className="empty">No students registered yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.firstName} {s.lastName}
                    </td>
                    <td>{s.email}</td>
                    <td>
                      {s.gradeLevel || '—'}
                      {s.section ? `-${s.section}` : ''}
                    </td>
                    <td>
                      {s.isApproved ? 'Approved' : 'Pending'}
                      {!s.isActive ? ' · Inactive' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Teachers</h2>
            <Link to="/principal/users?view=teacher" className="panel__link">
              Manage
            </Link>
          </div>
          {teachers.length === 0 ? (
            <p className="empty">
              No teachers yet.{' '}
              <Link to="/principal/users?view=teacher" className="panel__link">
                Create one
              </Link>
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subjects</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {t.firstName} {t.lastName}
                    </td>
                    <td>{t.email}</td>
                    <td>{t.subjects?.length ? t.subjects.join(', ') : '—'}</td>
                    <td>{t.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Pending approvals</h2>
          {pendingUsers.length > 0 && (
            <Link to="/principal/users?view=pending" className="panel__link">
              Review in People
            </Link>
          )}
        </div>
        {pendingUsers.length === 0 ? (
          <p className="empty">No pending student or parent accounts.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.firstName} {u.lastName}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td>{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">Latest announcements</h2>
        {data.announcements.length === 0 ? (
          <p className="empty">None yet.</p>
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
  );
}
