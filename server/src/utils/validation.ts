// Temporary type definitions until shared package is properly linked
export interface SearchParams {
  query: string;
  ll: string;
  radius?: number;
  categories?: string;
  limit?: number;
  sort?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate search parameters
 */
export function validateSearchParams(params: SearchParams): ValidationResult {
  const errors: string[] = [];

  // Validate query (can be empty for nearby searches)
  if (params.query === undefined || params.query === null) {
    errors.push('Query parameter is required');
  }

  // Validate location
  if (!params.ll) {
    errors.push('Location (ll) parameter is required');
  } else {
    const coords = params.ll.split(',');
    if (coords.length !== 2) {
      errors.push('Location must be in format "lat,lng"');
    } else {
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('Invalid latitude value');
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push('Invalid longitude value');
      }
    }
  }

  // Validate radius
  if (params.radius !== undefined) {
    if (params.radius < 0 || params.radius > 100000) {
      errors.push('Radius must be between 0 and 100000 meters');
    }
  }

  // Validate limit
  if (params.limit !== undefined) {
    if (params.limit < 1 || params.limit > 50) {
      errors.push('Limit must be between 1 and 50');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate user location
 */
export function validateUserLocation(location: UserLocation): ValidationResult {
  const errors: string[] = [];

  if (typeof location.lat !== 'number' || isNaN(location.lat)) {
    errors.push('Latitude must be a valid number');
  } else if (location.lat < -90 || location.lat > 90) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (typeof location.lng !== 'number' || isNaN(location.lng)) {
    errors.push('Longitude must be a valid number');
  } else if (location.lng < -180 || location.lng > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate place ID
 */
export function validatePlaceId(placeId: string): ValidationResult {
  const errors: string[] = [];

  if (!placeId || typeof placeId !== 'string') {
    errors.push('Place ID must be a non-empty string');
  } else if (placeId.length < 10 || placeId.length > 50) {
    errors.push('Place ID must be between 10 and 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate rating
 */
export function validateRating(rating: number): ValidationResult {
  const errors: string[] = [];

  if (typeof rating !== 'number' || isNaN(rating)) {
    errors.push('Rating must be a number');
  } else if (rating < 1 || rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== 'string') {
    errors.push('Email must be a non-empty string');
  } else if (!emailRegex.test(email)) {
    errors.push('Email must be in valid format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS protection
}

/**
 * Validate and sanitize query parameters
 */
export function sanitizeSearchParams(params: any): SearchParams {
  return {
    query: sanitizeString(params.query || '', 100),
    ll: sanitizeString(params.ll || '', 50),
    radius: params.radius ? Math.max(0, Math.min(100000, parseInt(params.radius))) : undefined,
    categories: sanitizeString(params.categories || '', 200),
    limit: params.limit ? Math.max(1, Math.min(50, parseInt(params.limit))) : undefined,
    sort: sanitizeString(params.sort || '', 20)
  };
}
