import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import FormDone from '../../components/ui/FormDone.jsx';
import Input from '../../components/ui/Input.jsx';

const emptyTeacher = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  employeeId: '',
  subjects: '',
};

function queryFor(view) {
  if (view === 'pending') return '?pending=true';
  if (view === 'all') return '';
  return `?role=${view}`;
}

function FamilyCell({ people = [], empty = '—', showPhone = false }) {
  const list = (people || []).filter((p) => p?.firstName);
  if (!list.length) return <span className="empty">{empty}</span>;
  return (
    <ul className="family-cell">
      {list.map((p) => (
        <li key={p.id}>
          <strong>
            {p.firstName} {p.lastName}
          </strong>
          {p.gradeLevel ? ` · Grade ${p.gradeLevel}${p.section ? `-${p.section}` : ''}` : ''}
          {showPhone ? (
            <span className="family-cell__phone">{p.phone ? ` · ${p.phone}` : ' · No phone'}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function PrincipalUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const filter =
    viewParam && ['pending', 'all', 'student', 'parent', 'teacher'].includes(viewParam)
      ? viewParam
      : 'student';

  const [users, setUsers] = useState([]);
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacher, setTeacher] = useState(emptyTeacher);
  const [link, setLink] = useState({ parentId: '', studentId: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [linking, setLinking] = useState(false);
  const [rowBusy, setRowBusy] = useState('');
  const [teacherDone, setTeacherDone] = useState(false);
  const [teacherDoneDetail, setTeacherDoneDetail] = useState('');
  const [linkDone, setLinkDone] = useState(false);
  const [linkDoneDetail, setLinkDoneDetail] = useState('');

  async function load(view = filter) {
    const [res, parentRes, studentRes] = await Promise.all([
      api.get(`/principal/users${queryFor(view)}`),
      api.get('/principal/users?role=parent'),
      api.get('/principal/users?role=student'),
    ]);
    setUsers(res.data.data);
    setParents(parentRes.data.data);
    setStudents(studentRes.data.data);
  }

  useEffect(() => {
    load(filter).catch((err) => setError(err.message));
  }, [filter]);

  function setFilter(next) {
    setSearchParams(next === 'student' ? {} : { view: next });
  }

  async function approve(id) {
    setError('');
    setMessage('');
    setRowBusy(`approve-${id}`);
    try {
      await api.patch(`/principal/users/${id}/approve`);
      setMessage('User approved.');
      await load(filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setRowBusy('');
    }
  }

  async function toggleActive(id, isActive) {
    setRowBusy(`active-${id}`);
    try {
      await api.patch(`/principal/users/${id}/active`, { isActive: !isActive });
      await load(filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setRowBusy('');
    }
  }

  async function createTeacher(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    setCreatingTeacher(true);
    try {
      const subjects = teacher.subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await api.post('/principal/teachers', {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        password: teacher.password,
        phone: teacher.phone || undefined,
        employeeId: teacher.employeeId || undefined,
        subjects: subjects.length ? subjects : undefined,
      });
      const created = res.data.data;
      setTeacherDoneDetail(
        `${created.firstName} ${created.lastName} (${created.email}). Share the password securely.`
      );
      setTeacher(emptyTeacher);
      setTeacherDone(true);
      setFilter('teacher');
      await load('teacher');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingTeacher(false);
    }
  }

  async function linkParent(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    setLinking(true);
    try {
      await api.post('/principal/link-parent', link);
      const parent = parents.find((p) => p.id === link.parentId);
      const student = students.find((s) => s.id === link.studentId);
      setLinkDoneDetail(
        `${parent ? `${parent.firstName} ${parent.lastName}` : 'Parent'} ↔ ${
          student ? `${student.firstName} ${student.lastName}` : 'student'
        }`
      );
      setLink({ parentId: '', studentId: '' });
      setLinkDone(true);
      await load(filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLinking(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">People</h1>
      <p className="page-sub">
        Create teacher logins, approve student/parent signups, and link families.
      </p>
      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {teacherDone ? (
        <FormDone
          title="Teacher created"
          message={teacherDoneDetail}
          actionLabel="Create another teacher"
          onContinue={() => {
            setTeacherDone(false);
            setTeacherDoneDetail('');
          }}
        />
      ) : (
        <form className="panel form-grid" onSubmit={createTeacher}>
          <h2 className="panel__title">Create teacher account</h2>
          <p className="empty">
            Teachers cannot sign up themselves. Set their email and temporary password here.
          </p>
          <div className="form-grid form-grid--2">
            <Input
              id="tFirst"
              label="First name"
              required
              value={teacher.firstName}
              onChange={(e) => setTeacher((t) => ({ ...t, firstName: e.target.value }))}
            />
            <Input
              id="tLast"
              label="Last name"
              required
              value={teacher.lastName}
              onChange={(e) => setTeacher((t) => ({ ...t, lastName: e.target.value }))}
            />
            <Input
              id="tEmail"
              type="email"
              label="Email (login)"
              required
              value={teacher.email}
              onChange={(e) => setTeacher((t) => ({ ...t, email: e.target.value }))}
            />
            <Input
              id="tPass"
              type="password"
              label="Temporary password"
              required
              minLength={8}
              value={teacher.password}
              onChange={(e) => setTeacher((t) => ({ ...t, password: e.target.value }))}
            />
            <Input
              id="tEmp"
              label="Employee ID"
              value={teacher.employeeId}
              onChange={(e) => setTeacher((t) => ({ ...t, employeeId: e.target.value }))}
            />
            <Input
              id="tPhone"
              label="Phone"
              value={teacher.phone}
              onChange={(e) => setTeacher((t) => ({ ...t, phone: e.target.value }))}
            />
          </div>
          <Input
            id="tSubjects"
            label="Subjects (comma-separated)"
            placeholder="Math, Science"
            value={teacher.subjects}
            onChange={(e) => setTeacher((t) => ({ ...t, subjects: e.target.value }))}
          />
          <Button
            type="submit"
            variant="clay"
            loading={creatingTeacher}
            loadingText="Creating…"
          >
            Create teacher
          </Button>
        </form>
      )}

      <div className="people-tabs" role="tablist" aria-label="Show people">
        {[
          { value: 'student', label: 'Students' },
          { value: 'teacher', label: 'Teachers' },
          { value: 'parent', label: 'Parents' },
          { value: 'pending', label: 'Pending' },
          { value: 'all', label: 'Everyone' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={filter === tab.value}
            className={`people-tabs__btn ${filter === tab.value ? 'is-active' : ''}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="panel">
        <h2 className="panel__title">
          {filter === 'teacher'
            ? 'Teachers'
            : filter === 'pending'
              ? 'Pending approval'
              : filter === 'all'
                ? 'Everyone'
                : filter === 'student'
                  ? 'Students'
                  : 'Parents'}
        </h2>
        {users.length === 0 ? (
          <p className="empty">No users in this view.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                {(filter === 'all' || filter === 'pending') && <th>Role</th>}
                <th>Email</th>
                <th>Phone</th>
                {filter === 'student' && <th>Grade</th>}
                {filter === 'student' && <th>Parents</th>}
                {filter === 'parent' && <th>Children</th>}
                {filter === 'teacher' && <th>Subjects</th>}
                {(filter === 'all' || filter === 'pending') && <th>Linked family</th>}
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.firstName} {u.lastName}
                  </td>
                  {(filter === 'all' || filter === 'pending') && (
                    <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  )}
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  {filter === 'student' && (
                    <td>
                      {u.gradeLevel || '—'}
                      {u.section ? `-${u.section}` : ''}
                    </td>
                  )}
                  {filter === 'student' && (
                    <td>
                      <FamilyCell
                        people={u.linkedParents}
                        empty="No parent linked"
                        showPhone
                      />
                    </td>
                  )}
                  {filter === 'parent' && (
                    <td>
                      <FamilyCell people={u.linkedChildren} empty="No student linked" />
                    </td>
                  )}
                  {filter === 'teacher' && (
                    <td>{u.subjects?.length ? u.subjects.join(', ') : '—'}</td>
                  )}
                  {(filter === 'all' || filter === 'pending') && (
                    <td>
                      {u.role === 'student' ? (
                        <FamilyCell
                          people={u.linkedParents}
                          empty="No parent"
                          showPhone
                        />
                      ) : u.role === 'parent' ? (
                        <FamilyCell people={u.linkedChildren} empty="No child" />
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  <td>
                    {u.isApproved ? 'Approved' : 'Pending'}
                    {!u.isActive ? ' · Inactive' : ''}
                  </td>
                  <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {!u.isApproved && (u.role === 'student' || u.role === 'parent') && (
                      <Button
                        variant="primary"
                        loading={rowBusy === `approve-${u.id}`}
                        loadingText="Approving…"
                        onClick={() => approve(u.id)}
                      >
                        Approve
                      </Button>
                    )}
                    {u.role !== 'principal' && (
                      <Button
                        variant="ghost"
                        loading={rowBusy === `active-${u.id}`}
                        loadingText={u.isActive ? 'Updating…' : 'Activating…'}
                        onClick={() => toggleActive(u.id, u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {linkDone ? (
        <FormDone
          title="Accounts linked"
          message={linkDoneDetail}
          actionLabel="Link another family"
          onContinue={() => {
            setLinkDone(false);
            setLinkDoneDetail('');
          }}
        />
      ) : (
        <section className="panel">
          <h2 className="panel__title">Link parent ↔ student</h2>
          <form className="form-grid form-grid--2" onSubmit={linkParent}>
            <Input
              id="parentId"
              as="select"
              label="Parent"
              required
              value={link.parentId}
              onChange={(e) => setLink((l) => ({ ...l, parentId: e.target.value }))}
            >
              <option value="">Select parent</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.email})
                </option>
              ))}
            </Input>
            <Input
              id="studentId"
              as="select"
              label="Student"
              required
              value={link.studentId}
              onChange={(e) => setLink((l) => ({ ...l, studentId: e.target.value }))}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.email})
                </option>
              ))}
            </Input>
            <Button type="submit" variant="secondary" loading={linking} loadingText="Linking…">
              Link accounts
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
