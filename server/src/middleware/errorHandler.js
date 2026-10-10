import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Something went wrong.';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists.';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier provided.';
  }

  if (err.message?.startsWith('CORS')) {
    statusCode = 403;
    message = 'Origin not allowed.';
  }

  if (!env.isProd) {
    console.error(err);
  } else if (statusCode >= 500) {
    console.error(err.message);
  }

  const body = {
    success: false,
    message: statusCode === 500 && env.isProd ? 'Something went wrong.' : message,
  };
  if (err.errors?.length) {
    body.errors = err.errors;
  }
  res.status(statusCode).json(body);
}
