import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { syncPrincipalFromEnv } from './config/syncPrincipal.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { applySecurity, apiLimiter, authLimiter } from './middleware/security.js';

async function start() {
  await connectDatabase();
  await syncPrincipalFromEnv();

  const app = express();
  const allowedOrigins = env.clientUrl
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: false, limit: '200kb' }));
  app.use(cookieParser());
  applySecurity(app);
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Root is API-only (frontend lives on Vercel) — avoid a bare 404 for health checks
  app.get('/', (req, res) => {
    res.json({
      success: true,
      service: 'Greenfield Academy API',
      health: '/api/health',
      docs: 'Use the Vercel frontend with VITE_API_URL pointing here.',
    });
  });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/signup', authLimiter);
  app.use('/api', apiLimiter);
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message || err);
  process.exit(1);
});
