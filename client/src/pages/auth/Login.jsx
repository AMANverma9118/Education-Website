import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROLE_HOME, useAuth } from '../../context/AuthContext.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Recaptcha, { resetRecaptcha } from '../../components/auth/Recaptcha.jsx';
import { focusFirstError, resolveFieldErrors } from '../../utils/formErrors.js';
import './Auth.css';

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');

    const local = {};
    if (!form.email.trim()) local.email = 'Email is required.';
    if (!form.password) local.password = 'Password is required.';
    if (!recaptchaToken) local.recaptchaToken = 'Please complete the captcha.';
    if (Object.keys(local).length) {
      setFieldErrors(local);
      focusFirstError(local);
      return;
    }

    setFieldErrors({});
    setBusy(true);
    try {
      const data = await login({ ...form, recaptchaToken });
      const portalHome = ROLE_HOME[data.user.role];
      const from = location.state?.from;
      const safeFrom =
        typeof from === 'string' &&
        Object.values(ROLE_HOME).some((path) => from === path || from.startsWith(`${path}/`))
          ? from
          : null;
      navigate(safeFrom || portalHome, { replace: true });
    } catch (err) {
      const mapped = resolveFieldErrors(err);
      const hasField = Boolean(mapped.email || mapped.password || mapped.recaptchaToken);
      setFieldErrors(mapped);
      setFormError(mapped._form || (!hasField ? err.message : ''));
      setRecaptchaToken('');
      resetRecaptcha();
      setCaptchaKey((k) => k + 1);
      focusFirstError(mapped);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-visual">
        <div className="auth-visual__bg" aria-hidden="true" />
        <div className="auth-visual__shade" aria-hidden="true" />
        <div className="auth-visual__grain" aria-hidden="true" />

        <Link to="/" className="auth-visual__home" aria-label="Back to Greenfield Academy home">
          <span className="school-mark" aria-hidden="true" />
          <span className="auth-visual__brand">
            Greenfield
            <em>Academy</em>
          </span>
        </Link>

        <div className="auth-visual__copy">
          <p className="auth-visual__eyebrow">School portal</p>
          <h2 className="auth-visual__headline">Welcome back to campus.</h2>
          <p className="auth-visual__tag">
            Students, parents, teachers, and the principal sign in here.
          </p>
          <div className="auth-visual__rule" aria-hidden="true" />
        </div>
      </aside>

      <div className="auth-panel">
        <Link to="/" className="auth-panel__mark" aria-label="Back to home">
          <span className="school-mark" aria-hidden="true" />
        </Link>

        <motion.div
          className="auth-card"
          variants={cardVariants}
          initial="hidden"
          animate="show"
        >
          <header className="auth-card__header">
            <p className="auth-card__eyebrow">School portal · Sign in</p>
            <h1>Welcome back</h1>
            <p className="auth-card__lede">
              Teachers use the email and password set by the principal.
            </p>
          </header>

          {formError && <Alert type="error">{formError}</Alert>}

          <motion.form
            onSubmit={onSubmit}
            variants={listVariants}
            initial="hidden"
            animate="show"
            noValidate
          >
            <motion.div className="auth-card__section" variants={itemVariants}>
              <p className="auth-card__section-title">Credentials</p>
              <div className="form-grid">
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  autoComplete="email"
                  required
                  value={form.email}
                  error={fieldErrors.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
                <Input
                  id="password"
                  type="password"
                  label="Password"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  error={fieldErrors.password}
                  onChange={(e) => setField('password', e.target.value)}
                />
              </div>
            </motion.div>

            <motion.div className="auth-card__actions" variants={itemVariants}>
              <div>
                <Recaptcha
                  key={captchaKey}
                  onChange={(token) => {
                    setRecaptchaToken(token);
                    setFieldErrors((prev) => {
                      if (!prev.recaptchaToken) return prev;
                      const next = { ...prev };
                      delete next.recaptchaToken;
                      return next;
                    });
                  }}
                />
                {fieldErrors.recaptchaToken && (
                  <p className="field__error">{fieldErrors.recaptchaToken}</p>
                )}
              </div>
              <Button
                type="submit"
                variant="clay"
                className="btn--block"
                loading={busy}
                loadingText="Signing in…"
              >
                Sign in
              </Button>
            </motion.div>
          </motion.form>

          <div className="auth-card__footer">
            <span>Greenfield Academy portal</span>
            <span>
              New here? <Link to="/signup">Create an account</Link>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
