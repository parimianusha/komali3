import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRouter from './routes/health.js';
import statsRouter from './routes/stats.js';
import documentsRouter from './routes/documents.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by client build/hosting
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Allow-List
const allowedOrigins = [
  env.APP_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);
      if (
        allowedOrigins.includes(requestOrigin) ||
        requestOrigin.endsWith('.vercel.app') ||
        requestOrigin.includes('localhost') ||
        requestOrigin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Mock-User-Id'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
});
app.use('/api/', generalLimiter);

// Specific stricter limiter for uploads & AI reprocessing
const processingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'PROCESSING_RATE_LIMITED',
      message: 'Too many upload or processing operations requested. Please wait a few moments.',
    },
  },
});
app.use('/api/v1/documents/:id/process', processingLimiter);

// Versioned API Routes (/api/v1)
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/documents', documentsRouter);

// Root health convenience
app.get('/health', (req, res) => {
  res.redirect('/api/v1/health');
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Centralized Error Handling
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[IDP Server] Running on http://0.0.0.0:${env.PORT}`);
    console.log(`[IDP Server] Environment: ${env.NODE_ENV}`);
    console.log(`[IDP Server] Gemini Model: ${env.GEMINI_MODEL}`);
    console.log(`[IDP Server] AI Processing: ${env.AI_PROCESSING_ENABLED ? 'ENABLED' : 'DISABLED'}`);
  });
}
