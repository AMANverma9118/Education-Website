import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROLE_HOME, useAuth } from '../../context/AuthContext.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Recaptcha, { resetRecaptcha } from '../../components/auth/Recaptcha.jsx';
import { focusFirstError, resolveFieldErrors } from '../../utils/formErrors.js';
import './Auth.css';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
];

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
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

function validateSignup(form, recaptchaToken) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'First name is required.';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!form.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email.';
  }
  if (!form.password) errors.password = 'Password is required.';
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (!/[A-Za-z]/.test(form.password)) errors.password = 'Password must include a letter.';
  else if (!/\d/.test(form.password)) errors.password = 'Password must include a number.';

  if (form.role === 'student' && !form.gradeLevel.trim()) {
    errors.gradeLevel = 'Students must select a grade level.';
  }
  if (form.role === 'parent') {
    if (!form.studentEmail.trim()) {
      errors.studentEmail = 'Enter your child’s student email to link their account.';
    }
    if (!form.familyLinkCode.trim()) {
      errors.familyLinkCode = 'Enter the family link code from the student dashboard.';
    }
  }
  if (!recaptchaToken) errors.recaptchaToken = 'Please complete the captcha.';
  return errors;
}

export default function Signup() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    gradeLevel: '',
    section: '',
    studentEmail: '',
    familyLinkCode: '',
  });
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

    const local = validateSignup(form, recaptchaToken);
    if (Object.keys(local).length) {
      setFieldErrors(local);
      focusFirstError(local);
      return;
    }

    setFieldErrors({});
    setBusy(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
        recaptchaToken,
      };
      if (form.role === 'student') {
        payload.gradeLevel = form.gradeLevel;
        payload.section = form.section || undefined;
      }
      if (form.role === 'parent') {
        payload.studentEmail = form.studentEmail;
        payload.familyLinkCode = form.familyLinkCode;
      }
      const data = await signup(payload);
      navigate(ROLE_HOME[data.user.role], { replace: true });
    } catch (err) {
      const mapped = resolveFieldErrors(err);
      setFieldErrors(mapped);
      setFormError(mapped._form || '');
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
          <p className="auth-visual__eyebrow">Enrolment</p>
          <h2 className="auth-visual__headline">A place families grow into.</h2>
          <p className="auth-visual__tag">
            Students register first. Parents register next and link with the student’s family code.
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
            <p className="auth-card__eyebrow">Admissions · Enrolment</p>
            <h1>Join the school</h1>
            <p className="auth-card__lede">
              {form.role === 'student'
                ? 'Create the student account first. You’ll get a family link code for your parent.'
                : 'Enter your child’s school email and family link code below to connect their grades.'}
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
              <p className="auth-card__section-title">Applicant</p>
              <div className="role-pills" role="radiogroup" aria-label="Role">
                {ROLES.map((r) => (
                  <label key={r.value}>
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={() => setField('role', r.value)}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </motion.div>

            <motion.div className="auth-card__section" variants={itemVariants}>
              <p className="auth-card__section-title">Details</p>
              <div className="form-grid form-grid--2">
                <Input
                  id="firstName"
                  label="First name"
                  required
                  value={form.firstName}
                  error={fieldErrors.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                />
                <Input
                  id="lastName"
                  label="Last name"
                  required
                  value={form.lastName}
                  error={fieldErrors.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                />
              </div>
            </motion.div>

            <motion.div className="auth-card__section" variants={itemVariants}>
              <p className="auth-card__section-title">Credentials</p>
              <div className="form-grid">
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  required
                  value={form.email}
                  error={fieldErrors.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
                <Input
                  id="password"
                  type="password"
                  label="Password (8+ chars, letter + number)"
                  required
                  minLength={8}
                  value={form.password}
                  error={fieldErrors.password}
                  onChange={(e) => setField('password', e.target.value)}
                />
                <Input
                  id="phone"
                  label="Phone (optional)"
                  value={form.phone}
                  error={fieldErrors.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                />
              </div>
            </motion.div>

            {form.role === 'student' && (
              <motion.div className="auth-card__section" variants={itemVariants}>
                <p className="auth-card__section-title">Class</p>
                <div className="form-grid form-grid--2">
                  <Input
                    id="gradeLevel"
                    label="Grade level"
                    required
                    placeholder="e.g. 8"
                    value={form.gradeLevel}
                    error={fieldErrors.gradeLevel}
                    onChange={(e) => setField('gradeLevel', e.target.value)}
                  />
                  <Input
                    id="section"
                    label="Section"
                    placeholder="e.g. A"
                    value={form.section}
                    error={fieldErrors.section}
                    onChange={(e) => setField('section', e.target.value)}
                  />
                </div>
              </motion.div>
            )}

            {form.role === 'parent' && (
              <motion.div className="auth-card__section" variants={itemVariants}>
                <p className="auth-card__section-title">Family link</p>
                <div className="form-grid form-grid--2">
                  <Input
                    id="studentEmail"
                    type="email"
                    label="Child’s student email"
                    required
                    placeholder="From student account"
                    value={form.studentEmail}
                    error={fieldErrors.studentEmail}
                    onChange={(e) => setField('studentEmail', e.target.value)}
                  />
                  <Input
                    id="familyLinkCode"
                    label="Family link code"
                    required
                    placeholder="From student dashboard"
                    value={form.familyLinkCode}
                    error={fieldErrors.familyLinkCode}
                    onChange={(e) => setField('familyLinkCode', e.target.value.toUpperCase())}
                  />
                </div>
              </motion.div>
            )}

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
                loadingText="Creating…"
              >
                Create account
              </Button>
            </motion.div>
          </motion.form>

          <div className="auth-card__footer">
            <span>Greenfield Academy portal</span>
            <span>
              Already registered? <Link to="/login">Sign in</Link>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
