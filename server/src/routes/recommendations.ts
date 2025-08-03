import { Router } from 'express';
import { RecommendationsController } from '../controllers/RecommendationsController';

const router = Router();
const recommendationsController = new RecommendationsController();

/**
 * POST /api/recommendations
 * Get AI-powered place recommendations based on user context
 */
router.post('/', recommendationsController.getRecommendations);

/**
 * POST /api/feedback
 * Submit user feedback for a recommendation
 */
router.post('/feedback', recommendationsController.submitFeedback);

export default router;
