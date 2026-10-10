import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import FormDone from '../../components/ui/FormDone.jsx';
import Input from '../../components/ui/Input.jsx';

const emptyForm = { title: '', body: '', audience: 'all', pinned: false };

export default function PrincipalAnnouncements() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [doneTitle, setDoneTitle] = useState('');

  async function load() {
    const res = await api.get('/announcements');
    setItems(res.data.data);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/announcements', {
        title: form.title,
        body: form.body,
        audience: [form.audience],
        pinned: form.pinned,
      });
      setDoneTitle(form.title);
      setForm(emptyForm);
      setDone(true);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Announcements</h1>
      <p className="page-sub">Share updates with the whole school or a specific audience.</p>
      {error && <Alert type="error">{error}</Alert>}

      {done ? (
        <FormDone
          title="Announcement published"
          message={doneTitle}
          actionLabel="Publish another"
          onContinue={() => {
            setDone(false);
            setDoneTitle('');
          }}
        />
      ) : (
        <form className="panel form-grid" onSubmit={onSubmit}>
          <Input
            id="title"
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            id="body"
            as="textarea"
            label="Message"
            required
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
          <Input
            id="audience"
            as="select"
            label="Audience"
            value={form.audience}
            onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
          >
            <option value="all">Everyone</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
            <option value="teacher">Teachers</option>
          </Input>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
            />
            Pin to top
          </label>
          <Button type="submit" variant="clay" loading={busy} loadingText="Publishing…">
            Publish
          </Button>
        </form>
      )}

      <section className="panel">
        <h2 className="panel__title">Published</h2>
        {items.length === 0 ? (
          <p className="empty">No announcements yet.</p>
        ) : (
          items.map((a) => (
            <article
              key={a._id}
              style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--line)' }}
            >
              <strong>
                {a.pinned ? 'Pinned · ' : ''}
                {a.title}
              </strong>
              <p className="empty">{a.body}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
