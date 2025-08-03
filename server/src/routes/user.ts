import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

/**
 * GET /api/user/history
 * Get user's search history
 */
router.get('/history', userController.getSearchHistory);

/**
 * GET /api/user/favorites
 * Get user's favorite places
 */
router.get('/favorites', userController.getFavorites);

/**
 * POST /api/user/favorites
 * Add a place to user's favorites
 */
router.post('/favorites', userController.addFavorite);

/**
 * DELETE /api/user/favorites/:placeId
 * Remove a place from user's favorites
 */
router.delete('/favorites/:placeId', userController.removeFavorite);

/**
 * GET /api/user/analytics
 * Get user analytics and insights
 */
router.get('/analytics', userController.getAnalytics);

export default router;
