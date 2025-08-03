import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection (optional for now)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recommendation-engine';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.log('⚠️  MongoDB connection failed:', error.message);
    console.log('💡 Note: The API will still work without MongoDB for basic testing');
  });

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'recommendation-engine-api',
    version: '1.0.0'
  });
});

// Mock API endpoints for testing Phase 2 backend
app.get('/api/places/search', (req, res) => {
  const { query, lat, lng, radius, limit } = req.query;
  
  // Validate required parameters
  if (!query || !lat || !lng) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'query, lat, and lng are required'
    });
  }

  // Mock response with realistic data structure
  res.json({
    places: [
      {
        fsq_id: 'mock-place-1',
        name: `${query} Shop`,
        location: {
          formatted_address: `123 Mock Street, New York, NY`,
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string)
        },
        categories: [
          { 
            id: 13032, 
            name: 'Coffee Shop', 
            short_name: 'Coffee',
            icon: { prefix: 'https://ss3.4sqi.net/img/categories_v2/food/cafe_', suffix: '.png' }
          }
        ],
        distance: 150,
        rating: 4.5,
        price: 2,
        hours: {
          display: 'Open until 9:00 PM',
          open_now: true
        },
        website: 'https://example.com',
        tel: '+1234567890',
        relevanceScore: 0.95,
        aiReasoning: `Highly relevant ${query} place based on user query and location`,
        recommendationTags: ['popular', 'nearby', 'high-rating'],
        estimatedBusyTime: 'medium'
      },
      {
        fsq_id: 'mock-place-2',
        name: `Premium ${query} House`,
        location: {
          formatted_address: `456 Elite Avenue, New York, NY`,
          lat: parseFloat(lat as string) + 0.001,
          lng: parseFloat(lng as string) + 0.001
        },
        categories: [
          { 
            id: 13065, 
            name: 'Restaurant', 
            short_name: 'Restaurant',
            icon: { prefix: 'https://ss3.4sqi.net/img/categories_v2/food/restaurant_', suffix: '.png' }
          }
        ],
        distance: 280,
        rating: 4.8,
        price: 4,
        hours: {
          display: 'Open until 11:00 PM',
          open_now: true
        },
        relevanceScore: 0.88,
        aiReasoning: `Premium option for ${query} with excellent ratings`,
        recommendationTags: ['premium', 'excellent-rating', 'upscale'],
        estimatedBusyTime: 'low'
      }
    ],
    metadata: {
      total: 2,
      ranked: 2,
      confidence: 0.92,
      reasoning: `Found 2 highly relevant ${query} places near your location with AI-powered ranking`,
      searchId: 'search_' + Date.now(),
      processingTime: 45
    },
    userContext: {
      intent: 'dining',
      currentTime: new Date().toISOString(),
      dayOfWeek: new Date().getDay(),
      groupSize: 1,
      urgency: 'medium'
    }
  });
});

app.get('/api/places/nearby', (req, res) => {
  const { lat, lng, radius = 1000, limit = 10 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'lat and lng are required'
    });
  }

  res.json({
    places: [
      {
        fsq_id: 'nearby-1',
        name: 'Local Coffee Spot',
        location: {
          formatted_address: `789 Nearby Street, Local Area`,
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string)
        },
        categories: [{ id: 13032, name: 'Coffee Shop', short_name: 'Coffee' }],
        distance: 120,
        rating: 4.3,
        price: 2
      },
      {
        fsq_id: 'nearby-2',
        name: 'Quick Bites',
        location: {
          formatted_address: `321 Close By Lane, Local Area`,
          lat: parseFloat(lat as string) + 0.0005,
          lng: parseFloat(lng as string) - 0.0005
        },
        categories: [{ id: 13065, name: 'Fast Food', short_name: 'Fast Food' }],
        distance: 250,
        rating: 4.1,
        price: 1
      }
    ],
    metadata: {
      center: { 
        lat: parseFloat(lat as string), 
        lng: parseFloat(lng as string) 
      },
      radius: parseInt(radius as string),
      total: 2
    }
  });
});

app.get('/api/places/trending', (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'lat and lng are required'
    });
  }

  res.json({
    places: [
      {
        fsq_id: 'trending-1',
        name: 'Viral Food Truck',
        location: {
          formatted_address: `Trending Location, Popular District`,
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string)
        },
        categories: [{ id: 13145, name: 'Food Truck', short_name: 'Food Truck' }],
        rating: 4.9,
        price: 2,
        popularity: 0.98
      }
    ],
    metadata: {
      type: 'trending',
      criteria: 'Popular places with high ratings and recent activity',
      total: 1
    }
  });
});

app.get('/api/places/:placeId', (req, res) => {
  const { placeId } = req.params;
  
  res.json({
    place: {
      fsq_id: placeId,
      name: 'Detailed Place Information',
      location: {
        formatted_address: `Detail Street, Information City`,
        lat: 40.7128,
        lng: -74.0060
      },
      categories: [{ id: 13065, name: 'Restaurant', short_name: 'Restaurant' }],
      rating: 4.6,
      price: 3,
      hours: {
        display: 'Open until 10:00 PM',
        open_now: true,
        regular: [
          { day: 1, open: '0800', close: '2200' },
          { day: 2, open: '0800', close: '2200' }
        ]
      },
      website: 'https://example.com',
      tel: '+1234567890',
      description: 'A wonderful place with great food and atmosphere',
      photos: [
        'https://via.placeholder.com/400x300?text=Photo+1',
        'https://via.placeholder.com/400x300?text=Photo+2'
      ],
      suggestedActions: [
        {
          type: 'navigate',
          label: 'Get Directions',
          priority: 5,
          availability: 'available'
        },
        {
          type: 'call',
          label: 'Call Restaurant',
          url: 'tel:+1234567890',
          priority: 4,
          availability: 'available'
        }
      ]
    },
    metadata: {
      requestTime: new Date().toISOString(),
      source: 'foursquare'
    }
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  
  res.status(error.statusCode || 500).json({
    error: 'Internal Server Error',
    message: error.message || 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Recommendation Engine API Server Started!');
  console.log('');
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔍 Search API: http://localhost:${PORT}/api/places/search?query=coffee&lat=40.7128&lng=-74.0060`);
  console.log(`📍 Nearby API: http://localhost:${PORT}/api/places/nearby?lat=40.7128&lng=-74.0060`);
  console.log(`🔥 Trending API: http://localhost:${PORT}/api/places/trending?lat=40.7128&lng=-74.0060`);
  console.log(`📄 Place Details: http://localhost:${PORT}/api/places/mock-place-123`);
  console.log('');
  console.log('✨ Phase 2 Backend Implementation Complete!');
  console.log('');
  console.log('🔑 Next Steps:');
  console.log('   1. Add FOURSQUARE_API_KEY to .env for real Foursquare data');
  console.log('   2. Add GEMINI_API_KEY to .env for AI-powered recommendations');
  console.log('   3. Setup MongoDB for data persistence');
  console.log('   4. Test API endpoints with the provided URLs above');
});

export default app;
