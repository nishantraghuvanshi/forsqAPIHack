# Personalized Recommendation Engine & Productivity Assistant

A full-stack application that provides AI-powered, context-aware location recommendations using the Foursquare Places API with real-time personalization and actionable suggestions.

## 🎯 Features

- **Context-Aware Recommendations**: AI-powered place suggestions based on user intent, location, and preferences
- **Real-Time Personalization**: Learning from user feedback to improve future recommendations
- **Actionable Suggestions**: Direct integration with maps, calling, and booking services
- **Smart Search**: Autocomplete and intelligent query understanding
- **Mobile-First Design**: Responsive UI optimized for mobile devices

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↓ HTTP Requests
Backend (Node.js + Express + TypeScript)
    ↓ API Calls
External Services:
    - Foursquare Places API
    - OpenAI API
    - MongoDB (User data & feedback)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB instance (local or cloud)
- API Keys for:
  - Foursquare Places API
  - OpenAI API

### Installation

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd project
   npm run setup
   ```

2. **Configure environment variables:**
   ```bash
   # Copy example env files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   
   # Edit with your API keys
   nano server/.env
   nano client/.env
   ```

3. **Start development servers:**
   ```bash
   # Start both client and server
   npm run dev
   
   # Or start individually
   npm run dev:server  # Backend on http://localhost:5000
   npm run dev:client  # Frontend on http://localhost:3000
   ```

## 📁 Project Structure

```
project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Helper functions
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── types/         # TypeScript types
│   └── package.json
├── shared/                 # Shared TypeScript types
└── docs/                   # Documentation
```

## 🔧 Available Scripts

```bash
npm run setup          # Install all dependencies
npm run dev           # Start both client and server
npm run dev:client    # Start frontend only
npm run dev:server    # Start backend only
npm run build         # Build both applications
npm run test          # Run all tests
npm run lint          # Lint all code
```

## 🌐 API Endpoints

### Authentication & Users
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/preferences` - Update user preferences

### Places & Search
- `GET /api/places/autocomplete` - Search autocomplete
- `POST /api/places/search` - Search places
- `GET /api/places/:fsq_id` - Get place details

### AI Recommendations
- `POST /api/recommendations` - Get AI-powered recommendations
- `POST /api/feedback` - Submit user feedback

### Analytics
- `GET /api/user/history` - User search history
- `GET /api/user/favorites` - User favorite places

## 🧪 Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 🚢 Deployment

### Using Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Build applications: `npm run build`
2. Set production environment variables
3. Deploy to your preferred platform (Vercel, Heroku, AWS, etc.)



## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using React, Node.js, Foursquare Places API, and OpenAI
