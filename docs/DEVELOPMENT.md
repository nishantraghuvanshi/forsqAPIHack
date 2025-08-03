# Development Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** and npm
- **MongoDB** (local or cloud instance)
- **Redis** (optional, for caching)
- **Git** for version control

## API Keys Required

1. **Foursquare Places API Key**
   - Sign up at [Foursquare Developer Portal](https://developer.foursquare.com/)
   - Create a new app and get your API key

2. **OpenAI API Key**
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Generate an API key with sufficient credits

## Project Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies:**
   ```bash
   npm run setup
   ```

3. **Environment configuration:**
   ```bash
   # Server environment
   cp server/.env.example server/.env
   # Edit server/.env with your API keys and database URL
   
   # Client environment
   cp client/.env.example client/.env
   # Edit client/.env with your configuration
   ```

4. **Database setup:**
   ```bash
   # Start MongoDB locally or use cloud instance
   # The app will create collections automatically
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```

## Development Workflow

### Server Development

```bash
cd server
npm run dev          # Start server with hot reload
npm run build        # Build TypeScript
npm run test         # Run tests
npm run lint         # Lint code
```

### Client Development

```bash
cd client
npm start            # Start React dev server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
```

### Shared Package Development

```bash
cd shared
npm run build        # Build shared types
npm run dev          # Watch mode for development
```

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

## Code Quality

### Linting
```bash
npm run lint         # Check all packages
npm run lint:fix     # Auto-fix issues
```

### Type Checking
```bash
npm run type-check   # TypeScript type checking
```

## Database Management

### MongoDB Collections

The app uses the following collections:

- **users**: User profiles and preferences
- **searchhistories**: User search history
- **feedbackitems**: User feedback on recommendations

### Database Initialization

```javascript
// Example user document
{
  _id: ObjectId,
  email: "user@example.com",
  preferences: {
    categories: ["coffee", "restaurants"],
    priceRange: [1, 3],
    maxDistance: 1000,
    preferredHours: { start: 8, end: 18 }
  },
  location: { lat: 40.7128, lng: -74.0060 },
  createdAt: Date,
  updatedAt: Date
}
```

## API Integration

### Foursquare Places API

The app integrates with several Foursquare endpoints:

- `/places/search` - Search for places
- `/places/autocomplete` - Autocomplete suggestions
- `/places/{fsq_id}` - Place details
- `/places/{fsq_id}/photos` - Place photos

### OpenAI Integration

Used for AI-powered ranking and recommendations:

- **Model**: GPT-3.5-turbo (configurable)
- **Purpose**: Rank places based on user intent
- **Input**: User query, context, place candidates
- **Output**: Ranked places with reasoning

## Architecture Patterns

### Server Architecture

```
Controllers -> Services -> Models
    |            |          |
    |            |      Database
    |        External APIs
 HTTP Routes
```

### Client Architecture

```
Components -> Hooks -> Services -> API
    |          |         |
  Material-UI  React   Axios
```

### State Management

- **Server State**: React Query for caching and synchronization
- **Client State**: React hooks and context
- **Form State**: React Hook Form

## Performance Optimization

### Server Optimizations

1. **Caching Strategy**
   ```typescript
   // Redis caching for frequent queries
   const cacheKey = `search:${lat}:${lng}:${query}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);
   ```

2. **Database Indexing**
   ```javascript
   // MongoDB indexes
   db.users.createIndex({ email: 1 }, { unique: true });
   db.searchhistories.createIndex({ userId: 1, timestamp: -1 });
   ```

3. **Rate Limiting**
   ```typescript
   // Express rate limiting
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   ```

### Client Optimizations

1. **Code Splitting**
   ```typescript
   const LazyComponent = lazy(() => import('./Component'));
   ```

2. **Image Optimization**
   ```typescript
   // Lazy loading and responsive images
   <img loading="lazy" srcSet="..." />
   ```

3. **Bundle Analysis**
   ```bash
   npm run build -- --analyze
   ```

## Debugging

### Server Debugging

1. **Logging**
   ```typescript
   import { logger } from '@/utils/logger';
   logger.info('User search', { userId, query });
   logger.error('API error', { error, context });
   ```

2. **Error Tracking**
   ```typescript
   // Global error handler
   app.use(errorHandler);
   ```

### Client Debugging

1. **React DevTools**
   - Install React Developer Tools browser extension
   - Use for component tree inspection

2. **Network Debugging**
   ```typescript
   // Axios interceptors for debugging
   axios.interceptors.request.use(request => {
     console.log('Starting Request', request);
     return request;
   });
   ```

## Deployment

### Environment Preparation

1. **Production Environment Variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   REDIS_URL=redis://...
   ```

2. **Build Process**
   ```bash
   npm run build
   ```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

1. **Build applications**
   ```bash
   npm run build
   ```

2. **Deploy server** (e.g., Heroku, AWS, DigitalOcean)
3. **Deploy client** (e.g., Vercel, Netlify, AWS S3)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MONGODB_URI environment variable
   - Ensure MongoDB is running
   - Check network connectivity

2. **API Rate Limits**
   - Implement proper caching
   - Add retry logic with exponential backoff
   - Monitor API usage

3. **CORS Issues**
   - Check CORS_ORIGIN environment variable
   - Ensure client URL is whitelisted

4. **Build Failures**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify environment variables

### Performance Issues

1. **Slow API Responses**
   - Check database query performance
   - Monitor external API response times
   - Implement proper caching

2. **High Memory Usage**
   - Monitor for memory leaks
   - Implement proper cleanup
   - Use streaming for large datasets

## Contributing

1. **Code Style**
   - Use ESLint and Prettier configurations
   - Follow TypeScript best practices
   - Write meaningful commit messages

2. **Pull Request Process**
   - Create feature branches
   - Write tests for new features
   - Update documentation
   - Request code review

3. **Testing Requirements**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - End-to-end tests for critical user flows
