import { Application } from 'express';
import placesRoutes from './places';
import recommendationsRoutes from './recommendations';
import authRoutes from './auth';
import userRoutes from './user';

export function setupRoutes(app: Application): void {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/places', placesRoutes);
  app.use('/api/recommendations', recommendationsRoutes);
  app.use('/api/user', userRoutes);
}
