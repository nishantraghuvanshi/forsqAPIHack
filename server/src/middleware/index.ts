import { Application } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';

export function setupMiddleware(app: Application): void {
  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.security.rateLimiting.windowMs,
    max: config.security.rateLimiting.maxRequests,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString()
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);
}
