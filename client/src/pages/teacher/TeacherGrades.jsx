import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

const emptyGrade = {
  classId: '',
  studentId: '',
  subject: '',
  title: '',
  score: '',
  maxScore: '100',
  term: '',
  comments: '',
};

export default function TeacherGrades() {
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [form, setForm] = useState(emptyGrade);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const current = classes.find((c) => c._id === form.classId);

  async function loadGrades() {
    const res = await api.get('/teacher/grades');
    setGrades(res.data.data || []);
  }

  useEffect(() => {
    Promise.all([api.get('/teacher/classes'), api.get('/teacher/grades')])
      .then(([classRes, gradeRes]) => {
        const list = classRes.data.data || [];
        setClasses(list);
        setGrades(gradeRes.data.data || []);
        if (list[0]) {
          setForm((f) => ({ ...f, classId: list[0]._id }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm({
      ...emptyGrade,
      classId: classes[0]?._id || '',
      maxScore: '100',
    });
    setShowForm(true);
    setMessage('');
    setError('');
  }

  function openEdit(grade) {
    setEditingId(grade._id);
    setForm({
      classId: grade.classRef?._id || grade.classRef || classes[0]?._id || '',
      studentId: grade.student?._id || grade.student || '',
      subject: grade.subject || '',
      title: grade.title || '',
      score: String(grade.score ?? ''),
      maxScore: String(grade.maxScore ?? '100'),
      term: grade.term || '',
      comments: grade.comments || '',
    });
    setShowForm(true);
    setMessage('');
    setError('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({
      ...emptyGrade,
      classId: classes[0]?._id || '',
      maxScore: '100',
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const payload = {
        subject: form.subject,
        title: form.title,
        score: Number(form.score),
        maxScore: Number(form.maxScore),
        term: form.term || undefined,
        comments: form.comments || undefined,
      };

      if (editingId) {
        await api.patch(`/teacher/grades/${editingId}`, payload);
        setMessage('Grade updated.');
      } else {
        await api.post('/teacher/grades', {
          ...payload,
          classId: form.classId,
          studentId: form.studentId,
        });
        setMessage('Grade recorded.');
      }

      await loadGrades();
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="empty">Loading grades…</p>;

  return (
    <div>
      <div className="portal__actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Grades</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            Review scores you recorded. Edit any row, or add a new grade for a student.
          </p>
        </div>
        <Button type="button" variant="clay" onClick={openAdd}>
          Add student grade
        </Button>
      </div>

      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {showForm && (
        <form className="panel form-grid" onSubmit={onSubmit} style={{ marginBottom: '1rem' }}>
          <div className="panel__head">
            <h2 className="panel__title">{editingId ? 'Edit grade' : 'Add student grade'}</h2>
            <button type="button" className="panel__link" onClick={closeForm}>
              Cancel
            </button>
          </div>

          {!editingId && (
            <>
              <Input
                id="classId"
                as="select"
                label="Class"
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value, studentId: '' }))}
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Input>
              <Input
                id="studentId"
                as="select"
                label="Student"
                required
                value={form.studentId}
                onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              >
                <option value="">Select student</option>
                {current?.students?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </Input>
            </>
          )}

          {editingId && (
            <p className="empty">
              Editing grade for{' '}
              <strong>
                {grades.find((g) => g._id === editingId)?.student?.firstName}{' '}
                {grades.find((g) => g._id === editingId)?.student?.lastName}
              </strong>
            </p>
          )}

          <div className="form-grid form-grid--2">
            <Input
              id="subject"
              label="Subject"
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
            <Input
              id="title"
              label="Assessment title"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="form-grid form-grid--2">
            <Input
              id="score"
              type="number"
              label="Score"
              required
              min="0"
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
            />
            <Input
              id="maxScore"
              type="number"
              label="Max score"
              required
              min="1"
              value={form.maxScore}
              onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
            />
          </div>
          <Input
            id="term"
            label="Term (optional)"
            value={form.term}
            onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
          />
          <Input
            id="comments"
            as="textarea"
            label="Comments"
            value={form.comments}
            onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
          />
          <Button
            type="submit"
            variant="primary"
            loading={busy}
            loadingText={editingId ? 'Updating…' : 'Saving…'}
          >
            {editingId ? 'Update grade' : 'Save grade'}
          </Button>
        </form>
      )}

      <section className="panel">
        <h2 className="panel__title">Recorded grades</h2>
        {grades.length === 0 ? (
          <p className="empty">No grades yet. Use “Add student grade” to record the first one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Title</th>
                <th>Score</th>
                <th>Term</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g._id}>
                  <td>
                    {g.student
                      ? `${g.student.firstName} ${g.student.lastName}`
                      : '—'}
                  </td>
                  <td>{g.classRef?.name || '—'}</td>
                  <td>{g.subject}</td>
                  <td>{g.title}</td>
                  <td>
                    {g.score}/{g.maxScore}
                  </td>
                  <td>{g.term || '—'}</td>
                  <td>
                    <Button type="button" variant="ghost" onClick={() => openEdit(g)}>
                      Edit
                    </Button>
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
