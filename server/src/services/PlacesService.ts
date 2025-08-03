import { FoursquareService } from './FoursquareService';
import { Place, SearchParams } from '../types';
import { logger } from '../utils/logger';

export class PlacesService {
  private foursquareService: FoursquareService;

  constructor() {
    this.foursquareService = new FoursquareService();
  }

  /**
   * Search for places using the Foursquare API
   */
  async searchPlaces(searchParams: SearchParams): Promise<Place[]> {
    try {
      return await this.foursquareService.searchPlaces(searchParams);
    } catch (error) {
      logger.error('Error searching places', { error, searchParams });
      throw new Error('Failed to search places');
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocomplete(query: string, location: string): Promise<any[]> {
    try {
      return await this.foursquareService.getAutocomplete(query, location);
    } catch (error) {
      logger.error('Error getting autocomplete', { error, query, location });
      throw new Error('Failed to get autocomplete suggestions');
    }
  }

  /**
   * Get detailed information about a place
   */
  async getPlaceDetails(placeId: string): Promise<Place | null> {
    try {
      return await this.foursquareService.getPlaceDetails(placeId);
    } catch (error) {
      logger.error('Error getting place details', { error, placeId });
      throw new Error('Failed to get place details');
    }
  }

  /**
   * Get photos for a place
   */
  async getPlacePhotos(placeId: string): Promise<any[]> {
    try {
      return await this.foursquareService.getPlacePhotos(placeId);
    } catch (error) {
      logger.error('Error getting place photos', { error, placeId });
      return []; // Return empty array instead of throwing for photos
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.foursquareService.healthCheck();
    } catch (error) {
      logger.error('Places service health check failed', error);
      return false;
    }
  }
}
