import { AppError } from '../utils/AppError.js';

/** Validates req.body with a Zod schema and replaces body with parsed data. */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.') || '_form',
        message: e.message,
      }));
      const message = errors[0]?.message || 'Invalid request data.';
      return next(new AppError(message, 400, errors));
    }
    req.body = result.data;
    next();
  };
}
