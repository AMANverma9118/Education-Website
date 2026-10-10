export class AppError extends Error {
  constructor(message, statusCode = 400, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (errors) this.errors = errors;
  }
}
