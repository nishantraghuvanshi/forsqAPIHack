import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  Place, 
  SearchQuery, 
  FoursquareSearchResponse, 
  FoursquareAutocompleteResponse,
  LatLng,
  Photo
} from '@recommendation-engine/shared';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

export class FoursquareService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.foursquare.baseUrl,
      headers: {
        'Authorization': config.foursquare.apiKey,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    // Request/Response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Foursquare API Request', {
          url: config.url,
          method: config.method,
          params: config.params
        });
        return config;
      },
      (error) => {
        logger.error('Foursquare API Request Error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Foursquare API Response', {
          url: response.config.url,
          status: response.status,
          dataSize: JSON.stringify(response.data).length
        });
        return response;
      },
      (error) => {
        logger.error('Foursquare API Response Error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for places based on query parameters
   */
  async searchPlaces(searchQuery: SearchQuery): Promise<Place[]> {
    try {
      const params = {
        query: searchQuery.query,
        ll: `${searchQuery.location.lat},${searchQuery.location.lng}`,
        radius: searchQuery.radius || config.foursquare.defaultRadius,
        categories: searchQuery.categories?.join(','),
        limit: Math.min(searchQuery.limit || 20, config.foursquare.maxResults),
        sort: this.mapSortOrder(searchQuery.sort),
        fields: 'fsq_id,name,location,categories,distance,rating,price,hours,photos,website,tel,verified,popularity'
      };

      const response: AxiosResponse<FoursquareSearchResponse> = await this.client.get('/places/search', { params });
      
      return this.transformPlaces(response.data.results);
    } catch (error) {
      logger.error('Error searching places', { error, searchQuery });
      throw new Error('Failed to search places from Foursquare API');
    }
  }

  /**
   * Get autocomplete suggestions for search input
   */
  async getAutocomplete(query: string, location: LatLng, limit: number = 10): Promise<string[]> {
    try {
      const params = {
        query,
        ll: `${location.lat},${location.lng}`,
        limit
      };

      const response: AxiosResponse<FoursquareAutocompleteResponse> = await this.client.get('/places/autocomplete', { params });
      
      return response.data.results.map(result => result.text);
    } catch (error) {
      logger.error('Error getting autocomplete suggestions', { error, query });
      throw new Error('Failed to get autocomplete suggestions from Foursquare API');
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(fsqId: string): Promise<Place | null> {
    try {
      const params = {
        fields: 'fsq_id,name,location,categories,distance,rating,price,hours,photos,website,tel,verified,popularity,description'
      };

      const response: AxiosResponse<Place> = await this.client.get(`/places/${fsqId}`, { params });
      
      return this.transformPlace(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        logger.warn('Place not found', { fsqId });
        return null;
      }
      logger.error('Error getting place details', { error, fsqId });
      throw new Error('Failed to get place details from Foursquare API');
    }
  }

  /**
   * Get photos for a specific place
   */
  async getPlacePhotos(fsqId: string, limit: number = 10): Promise<Photo[]> {
    try {
      const params = { limit };

      const response: AxiosResponse<{ photos: Photo[] }> = await this.client.get(`/places/${fsqId}/photos`, { params });
      
      return response.data.photos || [];
    } catch (error) {
      logger.error('Error getting place photos', { error, fsqId });
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Transform Foursquare places to our internal format
   */
  private transformPlaces(places: any[]): Place[] {
    return places.map(place => this.transformPlace(place));
  }

  /**
   * Transform a single Foursquare place to our internal format
   */
  private transformPlace(place: any): Place {
    return {
      fsq_id: place.fsq_id,
      name: place.name,
      location: {
        address: place.location?.address,
        locality: place.location?.locality,
        region: place.location?.region,
        postcode: place.location?.postcode,
        country: place.location?.country,
        formatted_address: place.location?.formatted_address,
        latitude: place.location?.latitude || place.geocodes?.main?.latitude,
        longitude: place.location?.longitude || place.geocodes?.main?.longitude
      },
      categories: place.categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon
      })) || [],
      distance: place.distance,
      rating: place.rating,
      price: place.price,
      hours: place.hours ? {
        display: place.hours.display,
        is_local_holiday: place.hours.is_local_holiday,
        open_now: place.hours.open_now,
        regular: place.hours.regular
      } : undefined,
      photos: place.photos?.map((photo: any) => ({
        id: photo.id,
        prefix: photo.prefix,
        suffix: photo.suffix,
        width: photo.width,
        height: photo.height
      })) || [],
      website: place.website,
      tel: place.tel,
      verified: place.verified,
      popularity: place.popularity
    };
  }

  /**
   * Map our sort order to Foursquare's sort parameters
   */
  private mapSortOrder(sort?: string): string {
    switch (sort) {
      case 'distance':
        return 'DISTANCE';
      case 'popularity':
        return 'POPULARITY';
      case 'rating':
        return 'RATING';
      case 'relevance':
      default:
        return 'RELEVANCE';
    }
  }

  /**
   * Health check for Foursquare API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Make a simple search to test API connectivity
      await this.client.get('/places/search', {
        params: {
          ll: '40.7128,-74.0060',
          limit: 1
        }
      });
      return true;
    } catch (error) {
      logger.error('Foursquare API health check failed', error);
      return false;
    }
  }
}
