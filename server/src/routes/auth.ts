import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/login
 * User authentication - create or login user
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authController.getProfile);

/**
 * PUT /api/auth/preferences
 * Update user preferences
 */
router.put('/preferences', authController.updatePreferences);

export default router;
