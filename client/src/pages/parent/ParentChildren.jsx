import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';

export default function ParentChildren() {
  const { childId } = useParams();
  const [list, setList] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/parent/dashboard')
      .then((res) => setList(res.data.data.children))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!childId) {
      setDetail(null);
      return;
    }
    api
      .get(`/parent/children/${childId}`)
      .then((res) => setDetail(res.data.data))
      .catch((err) => setError(err.message));
  }, [childId]);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!list) return <p className="empty">Loading…</p>;

  return (
    <div>
      <h1 className="page-title">Children</h1>
      <p className="page-sub">
        Link a child from Overview first, then open their grades and attendance here.
      </p>

      <section className="panel">
        {list.length === 0 ? (
          <p className="empty">
            No linked children yet. Go to Overview and enter the student email + family link code.
          </p>
        ) : (
          <ul>
            {list.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.5rem' }}>
                <Link to={`/parent/children/${c.id}`} style={{ color: 'var(--field)', fontWeight: 600 }}>
                  {c.firstName} {c.lastName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {detail && (
        <>
          <section className="panel">
            <h2 className="panel__title">
              {detail.child.firstName} {detail.child.lastName} — grades
            </h2>
            {detail.grades.length === 0 ? (
              <p className="empty">No grades.</p>
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
                  {detail.grades.map((g) => (
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
            <h2 className="panel__title">Attendance</h2>
            {detail.attendance.length === 0 ? (
              <p className="empty">No attendance records.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.attendance.map((r) => (
                    <tr key={r._id}>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td style={{ textTransform: 'capitalize' }}>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
