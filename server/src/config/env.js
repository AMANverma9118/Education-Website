import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'RECAPTCHA_SECRET_KEY',
  'PRINCIPAL_EMAIL',
  'PRINCIPAL_PASSWORD',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET.length < 32 && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

if (process.env.PRINCIPAL_PASSWORD.length < 8) {
  throw new Error('PRINCIPAL_PASSWORD must be at least 8 characters.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
  principalEmail: process.env.PRINCIPAL_EMAIL.trim().toLowerCase(),
  principalPassword: process.env.PRINCIPAL_PASSWORD,
  principalFirstName: process.env.PRINCIPAL_FIRST_NAME || 'School',
  principalLastName: process.env.PRINCIPAL_LAST_NAME || 'Principal',
  isProd: process.env.NODE_ENV === 'production',
};
