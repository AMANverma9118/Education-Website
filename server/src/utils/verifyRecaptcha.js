import { env } from '../config/env.js';
import { AppError } from './AppError.js';

/**
 * Verifies a Google reCAPTCHA v2 response token with Google's siteverify API.
 */
export async function verifyRecaptcha(token, remoteip) {
  if (!token || typeof token !== 'string') {
    throw new AppError('Please complete the captcha.', 400);
  }

  const body = new URLSearchParams({
    secret: env.recaptchaSecretKey,
    response: token,
  });

  if (remoteip) body.set('remoteip', remoteip);

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new AppError('Captcha verification service unavailable. Try again.', 503);
  }

  const data = await response.json();

  if (!data.success) {
    throw new AppError('Captcha failed. Please try again.', 400);
  }

  return true;
}
