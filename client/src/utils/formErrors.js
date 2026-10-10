/** Convert API / local validation errors into a field → message map. */
export function toFieldMap(errors = []) {
  const map = {};
  for (const item of errors) {
    const field = item.field || item.path || '_form';
    if (!map[field]) map[field] = item.message;
  }
  return map;
}

/** Infer a field from a generic message when the API only returns a string. */
export function inferFieldFromMessage(message = '') {
  const m = message.toLowerCase();
  if (m.includes('captcha')) return 'recaptchaToken';
  if (m.includes('password')) return 'password';
  if (m.includes('email') && m.includes('student')) return 'studentEmail';
  if (m.includes('family link') || m.includes('link code')) return 'familyLinkCode';
  if (m.includes('grade')) return 'gradeLevel';
  if (m.includes('first name')) return 'firstName';
  if (m.includes('last name')) return 'lastName';
  if (m.includes('email')) return 'email';
  if (m.includes('phone')) return 'phone';
  if (m.includes('section')) return 'section';
  return '_form';
}

export function resolveFieldErrors(err) {
  if (err?.errors?.length) return toFieldMap(err.errors);
  const message = err?.message || 'Something went wrong.';
  const field = inferFieldFromMessage(message);
  return { [field]: message };
}

/** Scroll the first invalid field into view (smooth). */
export function focusFirstError(fieldMap) {
  const first = Object.keys(fieldMap).find((k) => k !== '_form' && fieldMap[k]);
  if (!first) return;
  const el = document.getElementById(first);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  requestAnimationFrame(() => el.focus?.());
}
