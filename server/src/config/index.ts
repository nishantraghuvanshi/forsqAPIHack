import { AppConfig } from '@recommendation-engine/shared';

export const config: AppConfig = {
  foursquare: {
    apiKey: process.env.FOURSQUARE_API_KEY || '',
    baseUrl: process.env.FOURSQUARE_BASE_URL || 'https://api.foursquare.com/v3',
    defaultRadius: parseInt(process.env.DEFAULT_SEARCH_RADIUS || '1000'),
    maxResults: parseInt(process.env.MAX_SEARCH_RESULTS || '50')
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000')
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/recommendation-engine'
  },
  cache: {
    redis: process.env.REDIS_URL ? {
      url: process.env.REDIS_URL,
      ttl: 300 // 5 minutes default TTL
    } : undefined
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    }
  }
};

// Validate required environment variables
export function validateConfig(): void {
  const required = [
    'FOURSQUARE_API_KEY',
    'OPENAI_API_KEY',
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
