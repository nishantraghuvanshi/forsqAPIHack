import { AppConfig } from '../types';

export const config: AppConfig = {
  foursquare: {
    apiKey: process.env.FOURSQUARE_API_KEY || '',
    baseUrl: process.env.FOURSQUARE_BASE_URL || 'https://api.foursquare.com/v3',
    defaultRadius: parseInt(process.env.DEFAULT_SEARCH_RADIUS || '1000'),
    maxResults: parseInt(process.env.MAX_SEARCH_RESULTS || '50')
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000')
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/recommendation-engine'
  },
  cache: {
    redis: process.env.REDIS_URL ? {
      url: process.env.REDIS_URL,
      ttl: 3600 // 1 hour
    } : undefined
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    }
  }
};
