import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import FormDone from '../../components/ui/FormDone.jsx';
import Input from '../../components/ui/Input.jsx';

const emptyClass = {
  name: '',
  gradeLevel: '',
  section: '',
  academicYear: '2025-26',
  room: '',
  classTeacherId: '',
};

export default function PrincipalClasses() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyClass);
  const [assign, setAssign] = useState({ studentId: '', classId: '' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [createDone, setCreateDone] = useState(false);
  const [assignDone, setAssignDone] = useState(false);
  const [createDetail, setCreateDetail] = useState('');
  const [assignDetail, setAssignDetail] = useState('');

  async function load() {
    const [c, t, s] = await Promise.all([
      api.get('/principal/classes'),
      api.get('/principal/users?role=teacher'),
      api.get('/principal/users?role=student'),
    ]);
    setClasses(c.data.data);
    setTeachers(t.data.data.filter((u) => u.isApproved));
    setStudents(s.data.data.filter((u) => u.isApproved));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function createClass(e) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/principal/classes', {
        ...form,
        classTeacherId: form.classTeacherId || undefined,
        room: form.room || undefined,
      });
      setCreateDetail(`${form.name} · Grade ${form.gradeLevel}-${form.section}`);
      setForm(emptyClass);
      setCreateDone(true);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function assignStudent(e) {
    e.preventDefault();
    setError('');
    setAssigning(true);
    try {
      await api.post('/principal/assign-student', assign);
      const student = students.find((s) => s.id === assign.studentId);
      const klass = classes.find((c) => c._id === assign.classId);
      setAssignDetail(
        `${student ? `${student.firstName} ${student.lastName}` : 'Student'} → ${
          klass ? klass.name : 'class'
        }`
      );
      setAssign({ studentId: '', classId: '' });
      setAssignDone(true);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Classes</h1>
      <p className="page-sub">Create sections and place students with their class teacher.</p>
      {error && <Alert type="error">{error}</Alert>}

      {createDone ? (
        <FormDone
          title="Class created"
          message={createDetail}
          actionLabel="Create another class"
          onContinue={() => {
            setCreateDone(false);
            setCreateDetail('');
          }}
        />
      ) : (
        <form className="panel form-grid" onSubmit={createClass}>
          <h2 className="panel__title">New class</h2>
          <div className="form-grid form-grid--2">
            <Input
              id="name"
              label="Class name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              id="academicYear"
              label="Academic year"
              required
              value={form.academicYear}
              onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
            />
            <Input
              id="gradeLevel"
              label="Grade"
              required
              value={form.gradeLevel}
              onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
            />
            <Input
              id="section"
              label="Section"
              required
              value={form.section}
              onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
            />
            <Input
              id="room"
              label="Room"
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
            />
            <Input
              id="classTeacherId"
              as="select"
              label="Class teacher"
              value={form.classTeacherId}
              onChange={(e) => setForm((f) => ({ ...f, classTeacherId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </Input>
          </div>
          <Button type="submit" variant="primary" loading={creating} loadingText="Creating…">
            Create class
          </Button>
        </form>
      )}

      {assignDone ? (
        <div style={{ marginTop: '1rem' }}>
          <FormDone
            title="Student assigned"
            message={assignDetail}
            actionLabel="Assign another student"
            onContinue={() => {
              setAssignDone(false);
              setAssignDetail('');
            }}
          />
        </div>
      ) : (
        <form className="panel form-grid form-grid--2" onSubmit={assignStudent}>
          <h2 className="panel__title" style={{ gridColumn: '1 / -1' }}>
            Assign student
          </h2>
          <Input
            id="studentId"
            as="select"
            label="Student"
            required
            value={assign.studentId}
            onChange={(e) => setAssign((a) => ({ ...a, studentId: e.target.value }))}
          >
            <option value="">Select</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </Input>
          <Input
            id="classId"
            as="select"
            label="Class"
            required
            value={assign.classId}
            onChange={(e) => setAssign((a) => ({ ...a, classId: e.target.value }))}
          >
            <option value="">Select</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.gradeLevel}-{c.section})
              </option>
            ))}
          </Input>
          <Button type="submit" variant="secondary" loading={assigning} loadingText="Assigning…">
            Assign
          </Button>
        </form>
      )}

      <section className="panel">
        <h2 className="panel__title">All classes</h2>
        {classes.length === 0 ? (
          <p className="empty">No classes yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
                <th>Teacher</th>
                <th>Students</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>
                    {c.gradeLevel}-{c.section}
                  </td>
                  <td>
                    {c.classTeacher
                      ? `${c.classTeacher.firstName} ${c.classTeacher.lastName}`
                      : '—'}
                  </td>
                  <td>{c.students?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
