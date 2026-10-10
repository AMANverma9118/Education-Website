import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';

export default function StudentAttendance() {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/student/attendance')
      .then((res) => setRecords(res.data.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!records) return <p className="empty">Loading attendance…</p>;

  return (
    <div>
      <h1 className="page-title">Attendance</h1>
      <p className="page-sub">Daily attendance records marked by your teachers.</p>
      <section className="panel">
        {records.length === 0 ? (
          <p className="empty">No attendance records yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.status}</td>
                  <td>{r.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
