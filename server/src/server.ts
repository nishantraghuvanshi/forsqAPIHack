import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from project root
dotenv.config({ path: '/home/nish/Desktop/hackathons/forsquare place hack/project/.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recommendation-engine';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'recommendation-engine-api',
    environment: process.env.NODE_ENV,
    apis: {
      foursquare: process.env.FOURSQUARE_API_KEY ? 'configured' : 'missing',
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
      mongodb: process.env.MONGODB_URI ? 'configured' : 'missing'
    }
  });
});

// Test Foursquare API endpoint
app.get('/api/places/search', async (req, res) => {
  try {
    const { query = 'coffee', lat = '40.7128', lng = '-74.0060' } = req.query;
    
    const response = await fetch(`https://api.foursquare.com/v3/places/nearby?ll=${lat},${lng}&query=${query}&limit=5`, {
      headers: {
        'Authorization': `Bearer ${process.env.FOURSQUARE_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Foursquare API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      query: { query, lat, lng },
      results: data.results?.length || 0,
      places: data.results?.slice(0, 3) || [] // Return first 3 for testing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search places'
    });
  }
});

// Test Gemini AI endpoint
app.post('/api/recommendations/ai', async (req, res) => {
  try {
    const { places = [], context = "looking for coffee" } = req.body;
    
    // Simple mock response for now (would be replaced with actual Gemini API call)
    const mockRecommendation = {
      success: true,
      recommendation: `Based on your search for "${context}", I recommend checking out the top-rated places in your area. Consider factors like distance, ratings, and current hours.`,
      analysis: {
        totalPlaces: places.length,
        context,
        timestamp: new Date().toISOString()
      },
      gemini_configured: process.env.GEMINI_API_KEY ? true : false
    };
    
    res.json(mockRecommendation);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recommendations'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
