import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { playNotifySound, unlockNotifySound } from '../../utils/notifySound.js';
import './PrincipalNotificationBell.css';

const POLL_MS = 25000;
const SEEN_KEY = 'gf_principal_notif_seen';

function loadSeenIds() {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids) {
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

/**
 * Principal header bell — polls pending student/parent approvals,
 * shows a dropdown, and chimes when new requests arrive.
 */
export default function PrincipalNotificationBell() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [error, setError] = useState('');
  const wrapRef = useRef(null);
  const knownIdsRef = useRef(null);
  const seenIdsRef = useRef(loadSeenIds());

  const refresh = useCallback(async ({ announce } = { announce: true }) => {
    if (document.visibilityState === 'hidden') return;

    try {
      const { data } = await api.get('/principal/dashboard');
      const list = data.data?.pendingUsers || [];
      setPending(list);
      setError('');

      const ids = list.map((u) => u.id || u._id);
      const idSet = new Set(ids);

      if (knownIdsRef.current === null) {
        knownIdsRef.current = idSet;
        const unseen = ids.filter((id) => !seenIdsRef.current.has(id));
        setUnseenCount(unseen.length);
        return;
      }

      const newcomers = ids.filter((id) => !knownIdsRef.current.has(id));
      knownIdsRef.current = idSet;

      if (announce && newcomers.length > 0) {
        playNotifySound();
        newcomers.forEach((id) => seenIdsRef.current.delete(id));
      }

      const unseen = ids.filter((id) => !seenIdsRef.current.has(id));
      setUnseenCount(unseen.length);
    } catch (err) {
      setError(err.message || 'Could not load notifications.');
    }
  }, []);

  useEffect(() => {
    refresh({ announce: false });
    const timer = setInterval(() => refresh({ announce: true }), POLL_MS);

    const onVis = () => {
      if (document.visibilityState === 'visible') refresh({ announce: true });
    };
    document.addEventListener('visibilitychange', onVis);

    const unlock = () => unlockNotifySound();
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function markAllSeen() {
    pending.forEach((u) => seenIdsRef.current.add(u.id || u._id));
    saveSeenIds(seenIdsRef.current);
    setUnseenCount(0);
  }

  function toggle() {
    unlockNotifySound();
    setOpen((v) => {
      const next = !v;
      if (next) markAllSeen();
      return next;
    });
  }

  const showBadge = unseenCount > 0;

  return (
    <div className="notif" ref={wrapRef}>
      <button
        type="button"
        className={`notif__btn ${open ? 'is-open' : ''} ${showBadge ? 'has-new' : ''}`}
        aria-label={
          showBadge
            ? `${unseenCount} new approval notification${unseenCount === 1 ? '' : 's'}`
            : 'Notifications'
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
      >
        <svg className="notif__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm7-5.5V11a7 7 0 0 0-5.25-6.77V3.75a1.75 1.75 0 0 0-3.5 0v.48A7 7 0 0 0 5 11v5.5L3.4 18.1A1 1 0 0 0 4.1 19.8h15.8a1 1 0 0 0 .7-1.7L19 16.5Z"
          />
        </svg>
        {showBadge && (
          <span className="notif__badge" aria-hidden="true">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif__panel" role="dialog" aria-label="Approval notifications">
          <div className="notif__panel-head">
            <p className="notif__panel-title">Notifications</p>
            <p className="notif__panel-meta">
              {pending.length
                ? `${pending.length} pending approval${pending.length === 1 ? '' : 's'}`
                : 'All clear'}
            </p>
          </div>

          {error && <p className="notif__error">{error}</p>}

          <ul className="notif__list">
            {pending.length === 0 && !error && (
              <li className="notif__empty">No pending student or parent requests.</li>
            )}
            {pending.map((u) => {
              const id = u.id || u._id;
              return (
                <li key={id} className="notif__item">
                  <div>
                    <p className="notif__name">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="notif__detail">
                      <span className="notif__role">{u.role}</span>
                      {u.email}
                    </p>
                  </div>
                  <time className="notif__time" dateTime={u.createdAt}>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : ''}
                  </time>
                </li>
              );
            })}
          </ul>

          <div className="notif__panel-foot">
            <Link to="/principal/users?view=pending" onClick={() => setOpen(false)}>
              Review pending approvals
            </Link>
            <button type="button" className="notif__refresh" onClick={() => refresh({ announce: false })}>
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
