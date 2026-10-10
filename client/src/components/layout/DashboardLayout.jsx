import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Alert from '../ui/Alert.jsx';
import PrincipalNotificationBell from '../principal/PrincipalNotificationBell.jsx';
import './DashboardLayout.css';

const NAV = {
  student: [
    { to: '/student', label: 'Overview', end: true },
    { to: '/student/grades', label: 'Grades' },
    { to: '/student/attendance', label: 'Attendance' },
  ],
  parent: [
    { to: '/parent', label: 'Overview', end: true },
    { to: '/parent/children', label: 'Children' },
  ],
  teacher: [
    { to: '/teacher', label: 'Overview', end: true },
    { to: '/teacher/classes', label: 'Classes' },
    { to: '/teacher/grades', label: 'Record grade' },
  ],
  principal: [
    { to: '/principal', label: 'Overview', end: true },
    { to: '/principal/users', label: 'People' },
    { to: '/principal/classes', label: 'Classes' },
    { to: '/principal/announcements', label: 'Announcements' },
  ],
};

const ROLE_LABEL = {
  student: 'Student',
  parent: 'Parent',
  teacher: 'Faculty',
  principal: 'Principal',
};

export default function DashboardLayout() {
  const { user, logout, homePath } = useAuth();
  const links = NAV[user.role] || [];

  return (
    <div className={`dash dash--${user.role}`}>
      <aside className="dash__side">
        <Link to={homePath} className="dash__brand">
          <span className="dash__mono" aria-hidden="true">
            GA
          </span>
          <span className="dash__brand-text">
            Greenfield
            <em>Academy</em>
          </span>
        </Link>
        <p className="dash__role">{ROLE_LABEL[user.role] || user.role}</p>
        <nav className="dash__nav" aria-label="Portal">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="dash__logout" onClick={() => logout()}>
          Sign out
        </button>
      </aside>

      <div className="dash__main">
        <header className="dash__top">
          <div>
            <p className="dash__hello">
              {user.firstName} {user.lastName}
            </p>
            <p className="dash__email">{user.email}</p>
          </div>
          <div className="dash__top-actions">
            {user.role === 'principal' && <PrincipalNotificationBell />}
          </div>
        </header>

        {!user.isApproved && user.role === 'student' && (
          <div className="dash__banner">
            <Alert type="warn">
              Your student account is waiting for principal approval. After approval, share your
              family link code with your parent.
            </Alert>
          </div>
        )}
        {!user.isApproved && user.role === 'parent' && (
          <div className="dash__banner">
            <Alert type="warn">
              Your parent account unlocks after you link an approved student (email + family link
              code). Approving the child also unlocks you.
            </Alert>
          </div>
        )}
        {!user.isApproved && user.role === 'teacher' && (
          <div className="dash__banner">
            <Alert type="warn">
              Your teacher account is waiting for principal approval before you can mark attendance
              or grades.
            </Alert>
          </div>
        )}

        <div className="dash__content fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
