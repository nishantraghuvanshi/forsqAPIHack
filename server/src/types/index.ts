// Temporary type definitions - will be replaced by actual shared package

// Configuration interface
export interface AppConfig {
  foursquare: {
    apiKey: string;
    baseUrl: string;
    defaultRadius: number;
    maxResults: number;
  };
  gemini: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  database: {
    uri: string;
  };
  cache?: {
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

export interface Place {
  fsq_id: string;
  name: string;
  location: {
    formatted_address: string;
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  categories: Array<{
    id: number;
    name: string;
    short_name: string;
    plural_name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
  distance?: number;
  rating?: number;
  price?: number;
  hours?: {
    display?: string;
    is_local_holiday?: boolean;
    open_now?: boolean;
    regular?: Array<{
      close: string;
      day: number;
      open: string;
    }>;
  };
  website?: string;
  tel?: string;
  email?: string;
  description?: string;
  photos?: string[];
  verified?: boolean;
  popularity?: number;
  tips_count?: number;
  tastes?: string[];
  chains?: Array<{
    id: string;
    name: string;
  }>;
}

export interface RankedPlace extends Place {
  relevanceScore: number;
  aiReasoning: string;
  recommendationTags: string[];
  estimatedBusyTime: 'low' | 'medium' | 'high';
  suggestedActions?: ActionSuggestion[];
}

export interface SearchParams {
  query: string;
  ll: string; // lat,lng
  radius?: number;
  categories?: string;
  limit?: number;
  sort?: string;
  open_now?: boolean;
  min_price?: number;
  max_price?: number;
  fields?: string;
}

export interface UserContext {
  intent: string;
  currentTime: string;
  dayOfWeek: number;
  groupSize: number;
  urgency: 'low' | 'medium' | 'high';
  duration?: number;
  weather?: string;
  transportation?: string;
  budget?: 'low' | 'medium' | 'high';
}

export interface UserPreferences {
  categories: string[];
  priceRange: [number, number];
  maxDistance: number;
  preferredHours: {
    start: number;
    end: number;
  };
  avoidCategories?: string[];
  dietaryRestrictions?: string[];
  accessibility?: {
    wheelchair: boolean;
    parking: boolean;
  };
}

export interface FeedbackItem {
  placeId: string;
  rating: number;
  comment?: string;
  actionTaken?: string;
  context: UserContext;
  timestamp: Date;
  helpful?: boolean;
  visitDuration?: number;
  wouldReturn?: boolean;
}

export interface ActionSuggestion {
  type: 'navigate' | 'call' | 'book' | 'save' | 'share' | 'visit_website';
  label: string;
  url?: string;
  priority: number;
  availability: 'available' | 'unavailable' | 'conditional';
  metadata?: Record<string, any>;
}

export interface AIRankingResponse {
  rankedPlaces: RankedPlace[];
  reasoning: string;
  confidence: number;
  suggestedActions: ActionSuggestion[];
  metadata?: {
    processingTime?: number;
    modelVersion?: string;
    factors?: string[];
  };
}

export interface SearchResult {
  places: RankedPlace[];
  metadata: {
    total: number;
    ranked: number;
    confidence: number;
    reasoning: string;
    searchId: string;
    processingTime?: number;
  };
  userContext: UserContext;
  suggestions?: string[];
}

export interface AutocompleteResult {
  suggestions: Array<{
    text: string;
    highlight: Array<{
      start: number;
      length: number;
    }>;
  }>;
}

export interface PlaceDetailsResult {
  place: Place & {
    photos: string[];
    suggestedActions: ActionSuggestion[];
    userFeedback?: FeedbackItem;
    relatedPlaces?: Place[];
    busyTimes?: Array<{
      name: string;
      data: number[];
    }>;
  };
  metadata: {
    requestTime: string;
    source: string;
    cached?: boolean;
  };
}

export interface NearbyPlacesResult {
  places: Place[];
  metadata: {
    center: {
      lat: number;
      lng: number;
    };
    radius: number;
    total: number;
    categories?: string[];
  };
}

export interface TrendingPlacesResult {
  places: Place[];
  metadata: {
    type: 'trending';
    center: {
      lat: number;
      lng: number;
    };
    criteria: string;
    total: number;
    timeframe?: string;
  };
}

// Error types
export interface APIError {
  error: string;
  message: string;
  details?: string[];
  code?: string;
  statusCode?: number;
  timestamp?: string;
  requestId?: string;
}

// Database models interfaces
export interface IUser {
  _id?: string;
  email?: string;
  preferences?: UserPreferences;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedbackItem {
  _id?: string;
  userId: string;
  placeId: string;
  rating: number;
  comment?: string;
  actionTaken?: string;
  context: UserContext;
  helpful?: boolean;
  visitDuration?: number;
  wouldReturn?: boolean;
  createdAt: Date;
}

export interface ISearchHistory {
  _id?: string;
  userId: string;
  query: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  filters: {
    radius?: number;
    categories: string[];
    limit?: number;
  };
  results: string[];
  userContext: UserContext;
  sessionId?: string;
  createdAt: Date;
}
