# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Common Response Format
```json
{
  "success": boolean,
  "data": any,
  "error": {
    "code": string,
    "message": string,
    "details": any,
    "timestamp": string
  },
  "meta": {
    "total": number,
    "page": number,
    "limit": number,
    "timestamp": string
  }
}
```

## Endpoints

### Authentication

#### POST /api/auth/login
Create or login user session.

**Request Body:**
```json
{
  "userId": "optional-user-id",
  "email": "user@example.com",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "preferences": {
        "categories": ["coffee", "restaurants"],
        "priceRange": [1, 3],
        "maxDistance": 1000
      }
    }
  }
}
```

#### GET /api/auth/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "preferences": {...},
    "location": {...}
  }
}
```

#### PUT /api/auth/preferences
Update user preferences.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "categories": ["coffee", "coworking"],
  "priceRange": [1, 4],
  "maxDistance": 2000,
  "preferredHours": {
    "start": 8,
    "end": 18
  }
}
```

### Places

#### GET /api/places/autocomplete
Get search suggestions for place names.

**Query Parameters:**
- `query` (required): Search query string
- `lat` (required): Latitude
- `lng` (required): Longitude
- `limit` (optional): Max results (default: 10)

**Example:**
```
GET /api/places/autocomplete?query=coffee&lat=40.7128&lng=-74.0060
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "text": "Coffee shops near me",
      "highlight": [
        {
          "start": 0,
          "length": 6
        }
      ]
    }
  ]
}
```

#### POST /api/places/search
Search for places.

**Request Body:**
```json
{
  "query": "coffee shops",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "radius": 1000,
  "categories": ["13037"],
  "limit": 20,
  "sort": "distance"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "fsq_id": "place-id",
      "name": "Blue Bottle Coffee",
      "location": {
        "address": "123 Main St",
        "formatted_address": "123 Main St, New York, NY 10001",
        "latitude": 40.7130,
        "longitude": -74.0065
      },
      "categories": [
        {
          "id": "13037",
          "name": "Coffee Shop"
        }
      ],
      "distance": 250,
      "rating": 8.5,
      "price": 2,
      "hours": {
        "open_now": true,
        "display": "Open until 9:00 PM"
      }
    }
  ]
}
```

#### GET /api/places/:fsq_id
Get detailed place information.

**Response:**
```json
{
  "success": true,
  "data": {
    "fsq_id": "place-id",
    "name": "Blue Bottle Coffee",
    "location": {...},
    "categories": [...],
    "hours": {...},
    "photos": [...],
    "website": "https://bluebottlecoffee.com",
    "tel": "+1-555-0123",
    "verified": true,
    "popularity": 0.85
  }
}
```

### Recommendations

#### POST /api/recommendations
Get AI-powered recommendations.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "query": "I need a quiet place to work on my laptop",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "context": {
    "currentTime": "2023-08-03T14:30:00Z",
    "dayOfWeek": 4,
    "intent": "work",
    "urgency": "medium",
    "groupSize": 1,
    "duration": 120
  },
  "radius": 1500,
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rankedPlaces": [
      {
        "fsq_id": "place-id",
        "name": "Quiet Coffee Co",
        "location": {...},
        "relevanceScore": 0.92,
        "aiReasoning": "Perfect for laptop work with quiet atmosphere, reliable WiFi, and plenty of power outlets",
        "recommendationTags": ["wifi", "quiet", "power-outlets", "work-friendly"],
        "estimatedBusyTime": "low",
        "actionSuggestions": [
          {
            "type": "navigate",
            "label": "Get Directions",
            "url": "https://maps.google.com/...",
            "priority": 5
          },
          {
            "type": "call",
            "label": "Call to Reserve",
            "url": "tel:+1-555-0123",
            "priority": 3
          }
        ]
      }
    ],
    "reasoning": "Based on your request for a quiet work space...",
    "confidence": 0.87
  }
}
```

#### POST /api/feedback
Submit feedback for a recommendation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "placeId": "place-id",
  "rating": 4,
  "comment": "Great place for working, WiFi was fast",
  "context": {
    "currentTime": "2023-08-03T14:30:00Z",
    "intent": "work"
  },
  "actionTaken": "visit",
  "helpful": true
}
```

### User Data

#### GET /api/user/history
Get user's search history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "search-id",
      "query": {...},
      "results": [...],
      "selectedPlace": "place-id",
      "context": {...},
      "timestamp": "2023-08-03T14:30:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### GET /api/user/favorites
Get user's favorite places.

#### POST /api/user/favorites
Add place to favorites.

#### DELETE /api/user/favorites/:placeId
Remove place from favorites.

#### GET /api/user/analytics
Get user analytics and insights.

## Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `AUTHENTICATION_ERROR`: Invalid or expired token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `EXTERNAL_API_ERROR`: Foursquare/OpenAI API error
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_SERVER_ERROR`: Unexpected server error
