import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';

export default function StudentGrades() {
  const [grades, setGrades] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/student/grades')
      .then((res) => setGrades(res.data.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!grades) return <p className="empty">Loading grades…</p>;

  return (
    <div>
      <h1 className="page-title">Grades</h1>
      <p className="page-sub">All recorded assessments for your account.</p>
      <section className="panel">
        {grades.length === 0 ? (
          <p className="empty">No grades posted yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Title</th>
                <th>Term</th>
                <th>Score</th>
                <th>Teacher</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g._id}>
                  <td>{g.subject}</td>
                  <td>{g.title}</td>
                  <td>{g.term || '—'}</td>
                  <td>
                    {g.score}/{g.maxScore}
                  </td>
                  <td>
                    {g.gradedBy
                      ? `${g.gradedBy.firstName} ${g.gradedBy.lastName}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
