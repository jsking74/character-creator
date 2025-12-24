import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { AppDataSource } from './database/data-source.js';
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/characters.js';
import partyRoutes from './routes/parties.js';
import systemRoutes from './routes/systems.js';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173']; // Default dev origins

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - general API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Cookie parser for httpOnly cookie auth
app.use(cookieParser());

// Request body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});

// Health check - basic
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Health check - detailed (for monitoring)
app.get('/health/ready', async (_req, res) => {
  try {
    // Check database connectivity
    await AppDataSource.query('SELECT 1');
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/systems', systemRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Log database configuration (without password)
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const parsed = new URL(dbUrl);
    logger.info('Database config from DATABASE_URL', {
      host: parsed.hostname,
      port: parsed.port,
      database: parsed.pathname,
      user: parsed.username,
    });
  } catch {
    logger.error('Failed to parse DATABASE_URL', { url: dbUrl.substring(0, 20) + '...' });
  }
} else {
  logger.info('Database config from individual vars', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    database: process.env.DB_NAME || 'character_creator',
    useSqlite: process.env.USE_SQLITE,
    nodeEnv: process.env.NODE_ENV,
  });
}

// Database connection with retry logic
async function connectWithRetry(maxRetries = 5, delay = 5000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await AppDataSource.initialize();
      logger.info('Database connected successfully');
      return;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed: ${errorMsg}`);
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Start server immediately, then connect to database
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

// Connect to database with retry
connectWithRetry()
  .catch((err: Error) => {
    logger.error('Database connection failed after all retries', {
      error: err.message,
      stack: err.stack
    });
    // Don't exit - let the health check report the issue
  });
