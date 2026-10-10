import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import FormDone from '../../components/ui/FormDone.jsx';
import Input from '../../components/ui/Input.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ParentDashboard() {
  const { refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [linkForm, setLinkForm] = useState({ studentEmail: '', familyLinkCode: '' });
  const [busy, setBusy] = useState(false);
  const [linkDone, setLinkDone] = useState(false);
  const [linkDoneDetail, setLinkDoneDetail] = useState('');

  async function load() {
    const res = await api.get('/parent/dashboard');
    setData(res.data.data);
    // Sync approval status if server unlocked the parent via linked student
    try {
      await refreshUser();
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function onLink(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/parent/link-child', {
        studentEmail: linkForm.studentEmail,
        familyLinkCode: linkForm.familyLinkCode,
      });
      setLinkDoneDetail(res.data.message);
      setLinkForm({ studentEmail: '', familyLinkCode: '' });
      setLinkDone(true);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!data && error) return <Alert type="error">{error}</Alert>;
  if (!data) return <p className="empty">Loading family overview…</p>;

  const hasChildren = data.children.length > 0;

  return (
    <div className="portal portal--parent">
      <header className="portal__intro">
        <p className="portal__eyebrow">Family portal</p>
        <h1 className="page-title">Family overview</h1>
        <p className="page-sub">
          Students register first. Then link here with their email and family link code to see
          grades and attendance.
        </p>
      </header>

      {error && <Alert type="error">{error}</Alert>}

      {linkDone ? (
        <FormDone
          title="Child linked"
          message={linkDoneDetail}
          actionLabel="Link another child"
          onContinue={() => {
            setLinkDone(false);
            setLinkDoneDetail('');
          }}
        />
      ) : (
        <form className="panel form-grid" onSubmit={onLink}>
          <h2 className="panel__title">Link your child</h2>
          <div className="form-grid form-grid--2">
            <Input
              id="studentEmail"
              type="email"
              label="Student email"
              required
              value={linkForm.studentEmail}
              onChange={(e) => setLinkForm((f) => ({ ...f, studentEmail: e.target.value }))}
            />
            <Input
              id="familyLinkCode"
              label="Family link code"
              required
              placeholder="From student dashboard"
              value={linkForm.familyLinkCode}
              onChange={(e) =>
                setLinkForm((f) => ({ ...f, familyLinkCode: e.target.value.toUpperCase() }))
              }
            />
          </div>
          <Button type="submit" variant="primary" loading={busy} loadingText="Linking…">
            Link child
          </Button>
        </form>
      )}

      <section className="panel">
        <h2 className="panel__title">Children</h2>
        {!hasChildren ? (
          <p className="empty">No children linked yet.</p>
        ) : (
          <ul>
            {data.children.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.55rem' }}>
                <Link
                  to={`/parent/children/${c.id}`}
                  style={{ color: 'var(--field)', fontWeight: 600 }}
                >
                  {c.firstName} {c.lastName}
                </Link>
                <span className="empty">
                  {' '}
                  · Grade {c.gradeLevel || '—'}
                  {c.isApproved ? '' : ' · Student pending approval'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">Recent grades</h2>
        {data.recentGrades.length === 0 ? (
          <p className="empty">
            {hasChildren
              ? 'No grades posted yet for your children. Teachers add them from their portal.'
              : 'Link a child to see grades here.'}
          </p>
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
    </div>
  );
}