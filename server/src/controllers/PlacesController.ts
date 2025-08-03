import { Request, Response } from 'express';
import { PlacesService } from '../services/PlacesService';
import { GeminiService } from '../services/GeminiService';
import { SearchHistoryService } from '../services/SearchHistoryService';
import { UserService } from '../services/UserService';
import { logger } from '../utils/logger';
import { validateSearchParams, validateUserLocation } from '../utils/validation';
import { 
  SearchParams, 
  UserContext, 
  Place, 
  RankedPlace,
  AIRankingResponse 
} from '../types';

export class PlacesController {
  private placesService: PlacesService;
  private geminiService: GeminiService;
  private searchHistoryService: SearchHistoryService;
  private userService: UserService;

  constructor() {
    this.placesService = new PlacesService();
    this.geminiService = new GeminiService();
    this.searchHistoryService = new SearchHistoryService();
    this.userService = new UserService();
  }

  /**
   * Search for places with AI-powered ranking
   */
  async searchPlaces = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, lat, lng, radius, categories, limit } = req.query;
      const userId = req.headers['user-id'] as string;

      // Validate required parameters
      const searchParams: SearchParams = {
        query: query as string,
        ll: `${lat},${lng}`,
        radius: radius ? parseInt(radius as string) : undefined,
        categories: categories as string,
        limit: limit ? parseInt(limit as string) : 20
      };

      const validation = validateSearchParams(searchParams);
      if (!validation.isValid) {
        res.status(400).json({ 
          error: 'Invalid search parameters', 
          details: validation.errors 
        });
        return;
      }

      // Get user context
      const userContext: UserContext = {
        intent: this.determineIntent(query as string),
        currentTime: new Date().toISOString(),
        dayOfWeek: new Date().getDay(),
        groupSize: parseInt(req.query.groupSize as string) || 1,
        urgency: (req.query.urgency as string) || 'medium',
        duration: req.query.duration ? parseInt(req.query.duration as string) : undefined
      };

      // Get user preferences if user is authenticated
      let userPreferences;
      let userHistory;
      if (userId) {
        try {
          const user = await this.userService.getUserById(userId);
          userPreferences = user?.preferences;
          userHistory = await this.searchHistoryService.getUserFeedback(userId, 10);
        } catch (error) {
          logger.warn('Could not fetch user data', { userId, error });
        }
      }

      // Search places using Foursquare API
      const places = await this.placesService.searchPlaces(searchParams);

      if (places.length === 0) {
        res.json({
          places: [],
          message: 'No places found matching your criteria',
          suggestions: await this.generateSearchSuggestions(searchParams)
        });
        return;
      }

      // Rank places using Gemini AI
      const aiResponse: AIRankingResponse = await this.geminiService.rankPlaces(
        places,
        query as string,
        userContext,
        userPreferences,
        userHistory
      );

      // Generate action suggestions for top places
      const topPlaces = aiResponse.rankedPlaces.slice(0, 5);
      const placesWithActions = await Promise.all(
        topPlaces.map(async (place) => {
          const actions = await this.geminiService.generateActionSuggestions(place, userContext);
          return { ...place, suggestedActions: actions };
        })
      );

      // Log search for analytics and learning
      if (userId) {
        try {
          await this.searchHistoryService.logSearch(
            userId,
            searchParams,
            aiResponse.rankedPlaces.map(p => p.fsq_id),
            userContext
          );
        } catch (error) {
          logger.warn('Could not log search history', { userId, error });
        }
      }

      res.json({
        places: placesWithActions,
        metadata: {
          total: places.length,
          ranked: aiResponse.rankedPlaces.length,
          confidence: aiResponse.confidence,
          reasoning: aiResponse.reasoning,
          searchId: this.generateSearchId()
        },
        userContext
      });

    } catch (error) {
      logger.error('Error in searchPlaces controller', { error, query: req.query });
      res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to search places' 
      });
    }
  };

  /**
   * Get autocomplete suggestions
   */
  async getAutocomplete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, lat, lng } = req.query;

      if (!query) {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }

      const locationValidation = validateUserLocation({ 
        lat: parseFloat(lat as string), 
        lng: parseFloat(lng as string) 
      });

      if (!locationValidation.isValid) {
        res.status(400).json({ 
          error: 'Invalid location', 
          details: locationValidation.errors 
        });
        return;
      }

      const suggestions = await this.placesService.getAutocomplete(
        query as string,
        `${lat},${lng}`
      );

      res.json({ suggestions });

    } catch (error) {
      logger.error('Error in getAutocomplete controller', { error, query: req.query });
      res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to get autocomplete suggestions' 
      });
    }
  };

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId } = req.params;
      const userId = req.headers['user-id'] as string;

      if (!placeId) {
        res.status(400).json({ error: 'Place ID is required' });
        return;
      }

      // Get place details
      const place = await this.placesService.getPlaceDetails(placeId);

      if (!place) {
        res.status(404).json({ error: 'Place not found' });
        return;
      }

      // Get place photos
      const photos = await this.placesService.getPlacePhotos(placeId);

      // Get user context for action suggestions
      const userContext: UserContext = {
        intent: 'details',
        currentTime: new Date().toISOString(),
        dayOfWeek: new Date().getDay(),
        groupSize: 1,
        urgency: 'low'
      };

      // Generate action suggestions
      const suggestedActions = await this.geminiService.generateActionSuggestions(
        place,
        userContext
      );

      // Get user's previous feedback for this place if authenticated
      let userFeedback;
      if (userId) {
        try {
          userFeedback = await this.searchHistoryService.getUserFeedbackForPlace(userId, placeId);
        } catch (error) {
          logger.warn('Could not fetch user feedback', { userId, placeId, error });
        }
      }

      res.json({
        place: {
          ...place,
          photos,
          suggestedActions,
          userFeedback
        },
        metadata: {
          requestTime: new Date().toISOString(),
          source: 'foursquare'
        }
      });

    } catch (error) {
      logger.error('Error in getPlaceDetails controller', { error, placeId: req.params.placeId });
      res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to get place details' 
      });
    }
  };

  /**
   * Get places near a specific location
   */
  async getNearbyPlaces = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lat, lng, radius, categories, limit } = req.query;

      const locationValidation = validateUserLocation({ 
        lat: parseFloat(lat as string), 
        lng: parseFloat(lng as string) 
      });

      if (!locationValidation.isValid) {
        res.status(400).json({ 
          error: 'Invalid location', 
          details: locationValidation.errors 
        });
        return;
      }

      const searchParams: SearchParams = {
        query: '', // Empty query for nearby search
        ll: `${lat},${lng}`,
        radius: radius ? parseInt(radius as string) : 1000,
        categories: categories as string,
        limit: limit ? parseInt(limit as string) : 20
      };

      const places = await this.placesService.searchPlaces(searchParams);

      res.json({
        places,
        metadata: {
          center: { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
          radius: searchParams.radius,
          total: places.length
        }
      });

    } catch (error) {
      logger.error('Error in getNearbyPlaces controller', { error, query: req.query });
      res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to get nearby places' 
      });
    }
  };

  /**
   * Get trending places in an area
   */
  async getTrendingPlaces = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lat, lng, radius } = req.query;

      const locationValidation = validateUserLocation({ 
        lat: parseFloat(lat as string), 
        lng: parseFloat(lng as string) 
      });

      if (!locationValidation.isValid) {
        res.status(400).json({ 
          error: 'Invalid location', 
          details: locationValidation.errors 
        });
        return;
      }

      // Use popular categories for trending
      const trendingCategories = '13065,13003,13035,13236,13032'; // Food, bars, coffee, retail, entertainment

      const searchParams: SearchParams = {
        query: '',
        ll: `${lat},${lng}`,
        radius: radius ? parseInt(radius as string) : 2000,
        categories: trendingCategories,
        limit: 15,
        sort: 'rating' // Sort by rating for trending
      };

      const places = await this.placesService.searchPlaces(searchParams);

      // Filter to only highly rated places
      const trendingPlaces = places.filter(place => 
        place.rating && place.rating >= 4.0
      );

      res.json({
        places: trendingPlaces,
        metadata: {
          type: 'trending',
          center: { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
          criteria: 'Popular places with high ratings',
          total: trendingPlaces.length
        }
      });

    } catch (error) {
      logger.error('Error in getTrendingPlaces controller', { error, query: req.query });
      res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to get trending places' 
      });
    }
  };

  /**
   * Determine user intent from search query
   */
  private determineIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('eat') || lowerQuery.includes('food') || lowerQuery.includes('restaurant')) {
      return 'dining';
    }
    if (lowerQuery.includes('drink') || lowerQuery.includes('bar') || lowerQuery.includes('coffee')) {
      return 'drinks';
    }
    if (lowerQuery.includes('shop') || lowerQuery.includes('buy') || lowerQuery.includes('store')) {
      return 'shopping';
    }
    if (lowerQuery.includes('fun') || lowerQuery.includes('activity') || lowerQuery.includes('entertainment')) {
      return 'entertainment';
    }
    if (lowerQuery.includes('work') || lowerQuery.includes('office') || lowerQuery.includes('meeting')) {
      return 'work';
    }
    
    return 'general';
  }

  /**
   * Generate search suggestions when no results found
   */
  private async generateSearchSuggestions(searchParams: SearchParams): Promise<string[]> {
    const suggestions = [
      'Try expanding your search radius',
      'Remove specific category filters',
      'Search for broader terms',
      'Check your location is correct'
    ];

    if (searchParams.categories) {
      suggestions.push('Try searching without category filters');
    }

    if (searchParams.radius && searchParams.radius < 1000) {
      suggestions.push('Increase search radius to find more options');
    }

    return suggestions;
  }

  /**
   * Generate unique search ID for tracking
   */
  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
