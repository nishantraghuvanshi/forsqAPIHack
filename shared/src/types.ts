// Core types for the recommendation engine

// Geographic coordinates
export interface LatLng {
  lat: number;
  lng: number;
}

// User-related types
export interface User {
  id: string;
  email?: string;
  preferences: UserPreferences;
  location?: LatLng;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  categories: string[];
  priceRange: [number, number]; // [min, max] 1-4 scale
  maxDistance: number; // in meters
  preferredHours: {
    start: number; // 24-hour format
    end: number;
  };
  accessibility?: {
    wheelchairAccessible?: boolean;
    parkingRequired?: boolean;
  };
}

// Place-related types (based on Foursquare API)
export interface Place {
  fsq_id: string;
  name: string;
  location: PlaceLocation;
  categories: PlaceCategory[];
  distance?: number;
  rating?: number;
  price?: number; // 1-4 scale
  hours?: OpeningHours;
  photos?: Photo[];
  website?: string;
  tel?: string;
  verified?: boolean;
  popularity?: number;
}

export interface PlaceLocation {
  address?: string;
  locality?: string;
  region?: string;
  postcode?: string;
  country?: string;
  formatted_address?: string;
  latitude: number;
  longitude: number;
}

export interface PlaceCategory {
  id: string;
  name: string;
  icon?: {
    prefix: string;
    suffix: string;
  };
}

export interface OpeningHours {
  display?: string;
  is_local_holiday?: boolean;
  open_now?: boolean;
  regular?: DayHours[];
}

export interface DayHours {
  day: number; // 1=Monday, 7=Sunday
  open: string; // "0800"
  close: string; // "2200"
}

export interface Photo {
  id?: string;
  prefix: string;
  suffix: string;
  width?: number;
  height?: number;
}

// Search and recommendation types
export interface SearchQuery {
  query: string;
  location: LatLng;
  radius?: number; // in meters
  categories?: string[];
  limit?: number;
  sort?: 'distance' | 'popularity' | 'rating' | 'relevance';
}

export interface AutocompleteResult {
  text: string;
  highlight?: {
    start: number;
    length: number;
  }[];
}

export interface RankedPlace extends Place {
  relevanceScore: number;
  aiReasoning?: string;
  recommendationTags?: string[];
  estimatedBusyTime?: 'low' | 'medium' | 'high';
}

// AI and personalization types
export interface UserContext {
  currentTime: Date;
  dayOfWeek: number;
  weather?: WeatherInfo;
  intent: string;
  urgency?: 'low' | 'medium' | 'high';
  groupSize?: number;
  duration?: number; // expected stay duration in minutes
}

export interface WeatherInfo {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  humidity: number;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  placeId: string;
  rating: number; // 1-5 scale
  comment?: string;
  context: UserContext;
  actionTaken?: ActionType;
  timestamp: Date;
  helpful?: boolean; // was the recommendation helpful
}

// Action types for recommendations
export type ActionType = 'navigate' | 'call' | 'book' | 'save' | 'share' | 'visit_website';

export interface ActionSuggestion {
  type: ActionType;
  label: string;
  url?: string;
  priority: number; // 1-5, higher = more important
  availability?: 'available' | 'limited' | 'unavailable';
}

// Search history and analytics
export interface SearchHistory {
  id: string;
  userId: string;
  query: SearchQuery;
  results: Place[];
  selectedPlace?: string; // fsq_id of selected place
  context: UserContext;
  timestamp: Date;
  sessionId?: string;
}

export interface UserAnalytics {
  userId: string;
  totalSearches: number;
  favoriteCategories: string[];
  averageDistance: number;
  preferredTimes: number[];
  satisfactionScore: number; // derived from feedback
  lastActive: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: Date;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    timestamp: Date;
  };
}

// Foursquare API specific types
export interface FoursquareSearchResponse {
  results: Place[];
  context?: {
    geo_bounds?: {
      circle: {
        center: LatLng;
        radius: number;
      };
    };
  };
}

export interface FoursquareAutocompleteResponse {
  results: AutocompleteResult[];
}

// OpenAI integration types
export interface AIPromptContext {
  userQuery: string;
  userPreferences: UserPreferences;
  userContext: UserContext;
  candidatePlaces: Place[];
  userHistory?: SearchHistory[];
  feedbackHistory?: FeedbackItem[];
}

export interface AIRankingResponse {
  rankedPlaces: RankedPlace[];
  reasoning: string;
  confidence: number; // 0-1
  suggestedActions: ActionSuggestion[];
}

// Error types
export interface ApplicationError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: Date;
}

// Configuration types
export interface AppConfig {
  foursquare: {
    apiKey: string;
    baseUrl: string;
    defaultRadius: number;
    maxResults: number;
  };
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  database: {
    uri: string;
    options?: any;
  };
  cache: {
    redis?: {
      url: string;
      ttl: number;
    };
  };
  security: {
    jwtSecret: string;
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
    };
  };
}
