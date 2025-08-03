// Re-export types and utilities
export * from './types';
export * from './utils';

// Constants
export const API_ENDPOINTS = {
  FOURSQUARE: {
    BASE_URL: 'https://api.foursquare.com/v3',
    SEARCH: '/places/search',
    AUTOCOMPLETE: '/places/autocomplete',
    DETAILS: '/places',
    PHOTOS: '/places/{fsq_id}/photos'
  }
} as const;

export const PLACE_CATEGORIES = {
  RESTAURANTS: '13065',
  COFFEE: '13037',
  SHOPPING: '17000',
  ENTERTAINMENT: '10000',
  HEALTH: '17112',
  BUSINESS: '17140',
  TRAVEL: '19000'
} as const;

export const DEFAULT_SEARCH_RADIUS = 1000; // meters
export const MAX_SEARCH_RADIUS = 10000; // meters
export const DEFAULT_SEARCH_LIMIT = 20;
export const MAX_SEARCH_LIMIT = 50;
