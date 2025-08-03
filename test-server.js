// Simple Node.js server for testing the foundation
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Recommendation Engine API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test API endpoints
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Mock recommendations endpoint
app.post('/api/recommendations', (req, res) => {
  const { query, location } = req.body;
  
  res.json({
    success: true,
    data: {
      query,
      location,
      rankedPlaces: [
        {
          fsq_id: 'test-place-1',
          name: 'Mock Coffee Shop',
          location: {
            address: '123 Test Street',
            latitude: location?.lat || 40.7128,
            longitude: location?.lng || -74.0060
          },
          relevanceScore: 0.95,
          aiReasoning: 'Great for testing the API integration',
          recommendationTags: ['test', 'mock', 'coffee']
        }
      ],
      reasoning: 'This is a test response to verify the API is working',
      confidence: 0.9
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
});

module.exports = app;
