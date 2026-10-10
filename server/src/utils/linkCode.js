import crypto from 'crypto';

/** Short code a student shares with a parent to link accounts. */
export function createFamilyLinkCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}
