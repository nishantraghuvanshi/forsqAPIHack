import { Router } from 'express';
import { PlacesController } from '../controllers/PlacesController';

const router = Router();
const placesController = new PlacesController();

/**
 * GET /api/places/autocomplete
 * Get autocomplete suggestions for place search
 */
router.get('/autocomplete', placesController.getAutocomplete);

/**
 * POST /api/places/search
 * Search for places based on query and location
 */
router.post('/search', placesController.searchPlaces);

/**
 * GET /api/places/:fsq_id
 * Get detailed information about a specific place
 */
router.get('/:fsq_id', placesController.getPlaceDetails);

/**
 * GET /api/places/:fsq_id/photos
 * Get photos for a specific place
 */
router.get('/:fsq_id/photos', placesController.getPlacePhotos);

export default router;
