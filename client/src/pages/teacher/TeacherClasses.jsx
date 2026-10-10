import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toInputDate(value) {
  if (!value) return todayInputDate();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayInputDate();
  return d.toISOString().slice(0, 10);
}

function todayInputDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState(null);
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState(todayInputDate());
  const today = todayInputDate();
  const [statusMap, setStatusMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const current = classes?.find((c) => c._id === selected);

  async function loadAttendance() {
    const res = await api.get('/teacher/attendance');
    setRecords(res.data.data || []);
  }

  useEffect(() => {
    Promise.all([api.get('/teacher/classes'), api.get('/teacher/attendance')])
      .then(([classRes, attendanceRes]) => {
        const list = classRes.data.data || [];
        setClasses(list);
        setRecords(attendanceRes.data.data || []);
        if (list[0]) setSelected(list[0]._id);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!current || !showForm) return;
    const map = {};
    current.students?.forEach((s) => {
      map[s._id] = 'present';
    });

    // Prefill from existing records for this class + date
    const day = date;
    records.forEach((r) => {
      const classId = r.classRef?._id || r.classRef;
      if (String(classId) !== String(selected)) return;
      if (toInputDate(r.date) !== day) return;
      const studentId = r.student?._id || r.student;
      if (studentId) map[studentId] = r.status;
    });

    setStatusMap(map);
  }, [current, showForm, selected, date, records]);

  function openMarkForm() {
    setSelected(classes?.[0]?._id || '');
    setDate(todayInputDate());
    setShowForm(true);
    setMessage('');
    setError('');
  }

  function openEditSession(record) {
    const classId = record.classRef?._id || record.classRef;
    setSelected(String(classId));
    setDate(toInputDate(record.date));
    setShowForm(true);
    setMessage('');
    setError('');
  }

  function closeForm() {
    setShowForm(false);
  }

  async function saveAttendance(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const payloadRecords = Object.entries(statusMap).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      await api.post('/teacher/attendance', {
        classId: selected,
        date,
        records: payloadRecords,
      });
      setMessage('Attendance saved.');
      await loadAttendance();
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !classes) return <Alert type="error">{error}</Alert>;
  if (!classes) return <p className="empty">Loading classes…</p>;

  return (
    <div>
      <div className="portal__actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Classes & attendance</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            Review marked days in the table. Use Edit day to change statuses, or mark a new day.
          </p>
        </div>
        {classes.length > 0 && (
          <Button type="button" variant="clay" onClick={openMarkForm}>
            Mark attendance
          </Button>
        )}
      </div>

      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {classes.length === 0 ? (
        <section className="panel">
          <p className="empty">No classes assigned.</p>
        </section>
      ) : (
        <>
          {showForm && (
            <form className="panel form-grid" onSubmit={saveAttendance} style={{ marginBottom: '1rem' }}>
              <div className="panel__head">
                <h2 className="panel__title">Mark attendance</h2>
                <button type="button" className="panel__link" onClick={closeForm}>
                  Cancel
                </button>
              </div>

              <div className="form-grid form-grid--2">
                <Input
                  id="class"
                  as="select"
                  label="Class"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.gradeLevel}-{c.section})
                    </option>
                  ))}
                </Input>
                <Input
                  id="date"
                  type="date"
                  label="Date"
                  value={date}
                  max={today}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDate(next && next > todayInputDate() ? todayInputDate() : next);
                  }}
                />
              </div>

              {current?.students?.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.students.map((s) => (
                      <tr key={s._id}>
                        <td>
                          {s.firstName} {s.lastName}
                        </td>
                        <td>
                          <select
                            value={statusMap[s._id] || 'present'}
                            onChange={(e) =>
                              setStatusMap((m) => ({ ...m, [s._id]: e.target.value }))
                            }
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty">This class has no students yet.</p>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={!current?.students?.length}
                loading={busy}
                loadingText="Saving…"
              >
                Save attendance
              </Button>
            </form>
          )}

          <section className="panel">
            <h2 className="panel__title">Attendance records</h2>
            {records.length === 0 ? (
              <p className="empty">
                No attendance yet. Use “Mark attendance” to record the first day.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.classRef?.name || '—'}</td>
                      <td>
                        {r.student
                          ? `${r.student.firstName} ${r.student.lastName}`
                          : '—'}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{r.status}</td>
                      <td>
                        <Button type="button" variant="ghost" onClick={() => openEditSession(r)}>
                          Edit day
                        </Button>
                      </td>
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
