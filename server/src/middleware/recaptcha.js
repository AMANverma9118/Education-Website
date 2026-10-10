import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyRecaptcha } from '../utils/verifyRecaptcha.js';

/** Requires `recaptchaToken` on the request body (Google reCAPTCHA v2). */
export const requireRecaptcha = asyncHandler(async (req, res, next) => {
  const token = req.body?.recaptchaToken;
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim();
  await verifyRecaptcha(token, ip);
  // Do not keep the token around after verification
  delete req.body.recaptchaToken;
  next();
});
