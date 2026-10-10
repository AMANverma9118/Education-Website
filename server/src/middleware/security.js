import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

export function applySecurity(app) {
  app.disable('x-powered-by');

  // Strip keys that start with $ or contain . (NoSQL injection)
  app.use(
    mongoSanitize({
      replaceWith: '_',
      allowDots: false,
    })
  );

  // Block HTTP parameter pollution
  app.use(hpp());
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
});
