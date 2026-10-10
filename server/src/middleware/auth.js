import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';

export const protect = asyncHandler(async (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = bearer || req.cookies?.token;

  if (!token) {
    throw new AppError('Please sign in to continue.', 401);
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new AppError('Session expired. Please sign in again.', 401);
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    throw new AppError('Account not found or deactivated.', 401);
  }

  req.user = user;
  next();
});

export const requireApproved = (req, res, next) => {
  if (req.user.role === 'principal' || req.user.isApproved) {
    return next();
  }
  return next(
    new AppError('Your account is waiting for principal approval.', 403)
  );
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have access to this resource.', 403));
  }
  next();
};
