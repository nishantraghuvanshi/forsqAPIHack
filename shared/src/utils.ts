// Utility functions shared between client and server

import { LatLng, Place, UserPreferences } from './types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param point1 First coordinate
 * @param point2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance for display
 * @param distanceInMeters Distance in meters
 * @returns Formatted string (e.g., "1.2 km", "500 m")
 */
export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)} km`;
}

/**
 * Generate Google Maps URL for navigation
 * @param place Place to navigate to
 * @returns Google Maps URL
 */
export function generateGoogleMapsUrl(place: Place): string {
  const { latitude, longitude } = place.location;
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/**
 * Generate Apple Maps URL for navigation
 * @param place Place to navigate to
 * @returns Apple Maps URL
 */
export function generateAppleMapsUrl(place: Place): string {
  const { latitude, longitude } = place.location;
  return `http://maps.apple.com/?daddr=${latitude},${longitude}`;
}

/**
 * Detect if user is on mobile device
 * @returns Platform type
 */
export function detectPlatform(): 'ios' | 'android' | 'web' {
  try {
    if (typeof navigator === 'undefined') return 'web';
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    }
    
    return 'web';
  } catch {
    return 'web';
  }
}

/**
 * Get appropriate maps URL based on platform
 * @param place Place to navigate to
 * @returns Platform-appropriate maps URL
 */
export function getNavigationUrl(place: Place): string {
  const platform = detectPlatform();
  
  switch (platform) {
    case 'ios':
      return generateAppleMapsUrl(place);
    case 'android':
      return generateGoogleMapsUrl(place);
    default:
      return generateGoogleMapsUrl(place);
  }
}

/**
 * Format phone number for calling
 * @param phoneNumber Raw phone number
 * @returns Formatted tel: URL
 */
export function formatPhoneUrl(phoneNumber: string): string {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  return `tel:${cleaned}`;
}

/**
 * Check if a place is currently open
 * @param place Place to check
 * @param currentTime Current time (defaults to now)
 * @returns Whether the place is open
 */
export function isPlaceOpen(place: Place, currentTime: Date = new Date()): boolean {
  if (!place.hours || !place.hours.regular) {
    return true; // Assume open if no hours data
  }

  const day = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Find today's hours (Foursquare uses 1=Monday, 7=Sunday)
  const foursquareDay = day === 0 ? 7 : day;
  const todayHours = place.hours.regular.find(h => h.day === foursquareDay);

  if (!todayHours) {
    return false; // Closed if no hours for today
  }

  const openTime = parseInt(todayHours.open.slice(0, 2)) * 60 + parseInt(todayHours.open.slice(2));
  const closeTime = parseInt(todayHours.close.slice(0, 2)) * 60 + parseInt(todayHours.close.slice(2));

  // Handle overnight hours (e.g., open until 2 AM)
  if (closeTime < openTime) {
    return currentTimeMinutes >= openTime || currentTimeMinutes <= closeTime;
  }

  return currentTimeMinutes >= openTime && currentTimeMinutes <= closeTime;
}

/**
 * Get opening status text
 * @param place Place to check
 * @param currentTime Current time
 * @returns Status text
 */
export function getOpeningStatus(place: Place, currentTime: Date = new Date()): string {
  if (!place.hours) {
    return 'Hours unknown';
  }

  if (place.hours.open_now !== undefined) {
    return place.hours.open_now ? 'Open now' : 'Closed';
  }

  return isPlaceOpen(place, currentTime) ? 'Open now' : 'Closed';
}

/**
 * Validate geographic coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns Whether coordinates are valid
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Sanitize user input for search queries
 * @param input Raw user input
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .slice(0, 200); // Limit length
}

/**
 * Generate place photo URL
 * @param photo Photo object from Foursquare
 * @param size Desired size (width)
 * @returns Full photo URL
 */
export function generatePhotoUrl(photo: { prefix: string; suffix: string }, size: number = 300): string {
  return `${photo.prefix}${size}x${size}${photo.suffix}`;
}

/**
 * Calculate relevance score based on user preferences
 * @param place Place to score
 * @param userLocation User's current location
 * @param preferences User preferences
 * @returns Relevance score (0-1)
 */
export function calculateRelevanceScore(
  place: Place,
  userLocation: LatLng,
  preferences: UserPreferences
): number {
  let score = 0;
  
  // Distance factor (closer is better, max score at 0m, min at maxDistance)
  if (place.distance !== undefined) {
    const distanceScore = Math.max(0, 1 - (place.distance / preferences.maxDistance));
    score += distanceScore * 0.3;
  }
  
  // Price preference factor
  if (place.price && preferences.priceRange) {
    const [minPrice, maxPrice] = preferences.priceRange;
    if (place.price >= minPrice && place.price <= maxPrice) {
      score += 0.2;
    }
  }
  
  // Category preference factor
  if (place.categories && preferences.categories.length > 0) {
    const matchingCategories = place.categories.filter(cat => 
      preferences.categories.some(prefCat => 
        cat.name.toLowerCase().includes(prefCat.toLowerCase())
      )
    );
    const categoryScore = matchingCategories.length / preferences.categories.length;
    score += categoryScore * 0.3;
  }
  
  // Rating factor
  if (place.rating) {
    score += (place.rating / 10) * 0.2; // Assuming 10 is max rating
  }
  
  return Math.min(1, score);
}

/**
 * Debounce function for search input
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a unique session ID
 * @returns Unique session identifier
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format time for display
 * @param date Date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format date for display
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Check if two coordinates are approximately equal (within tolerance)
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @param tolerance Tolerance in meters (default: 100m)
 * @returns Whether coordinates are approximately equal
 */
export function coordinatesEqual(
  coord1: LatLng, 
  coord2: LatLng, 
  tolerance: number = 100
): boolean {
  const distance = calculateDistance(coord1, coord2);
  return distance <= tolerance;
}
