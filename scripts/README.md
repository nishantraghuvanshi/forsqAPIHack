# Utility Scripts Documentation

This folder contains utility scripts to help set up and manage the Personalized Recommendation Engine project.

## Scripts Overview

### 1. setup.sh

**Purpose**: Complete project initialization and dependency installation

- Installs dependencies for both client and server
- Creates necessary directories and configuration files
- Sets up the development environment
- **Usage**: `npm run setup` or `./scripts/setup.sh`

### 2. configure-api-keys.sh

**Purpose**: Interactive API key configuration

- Guides you through setting up Foursquare Places API keys
- Helps configure Google Gemini AI API keys
- Creates and updates environment files
- Validates API key formats
- **Usage**: `npm run configure` or `./scripts/configure-api-keys.sh`

### 3. validate-env.sh

**Purpose**: Environment validation and health checks

- Checks if all required environment variables are set
- Validates API key formats and accessibility
- Verifies MongoDB connection strings
- Ensures all configuration files are properly set up
- **Usage**: `npm run validate` or `./scripts/validate-env.sh`

### 4. validate-env.js

**Purpose**: JavaScript-based environment validation

- Node.js version of environment validation
- More detailed error reporting and validation
- Used by automated testing scripts
- **Usage**: `node scripts/validate-env.js`

### 5. test-setup.sh

**Purpose**: Comprehensive project testing and validation

- Tests environment configuration
- Validates server startup and compilation
- Tests client build process
- Checks API endpoints functionality
- Generates detailed test reports
- **Usage**: `./scripts/test-setup.sh`

### 6. test-server.js

**Purpose**: Simple test server for basic functionality testing

- Lightweight Express server for testing
- Health check endpoint
- Used for quick API testing during development
- **Usage**: `node scripts/test-server.js`

### 7. test-frontend.html

**Purpose**: Frontend testing and API interaction testing

- Simple HTML page for testing frontend components
- Direct API interaction testing
- Useful for debugging frontend-backend communication
- **Usage**: Open in browser after starting server

## When to Use These Scripts

### For First-Time Setup

1. Run `npm run setup` to initialize the project
2. Run `npm run configure` to set up your API keys
3. Run `npm run validate` to ensure everything is configured correctly
4. Run `./scripts/test-setup.sh` for comprehensive testing (optional)

### For Development

- Use `validate` whenever you modify environment variables
- Use `configure` when you need to update API keys
- Use `test-setup.sh` for comprehensive project testing
- Use `test-server.js` for quick API testing
- Scripts help maintain consistent development environment across team members

### For Hackathons/Quick Demos

These scripts are especially useful for:

- Rapid project setup and deployment
- Ensuring all team members have consistent configurations
- Quick validation that all APIs are properly connected
- Streamlined onboarding for new developers
- Comprehensive testing before demos

## Prerequisites

Before running these scripts, ensure you have:

- Node.js and npm installed
- Bash shell (Linux/macOS) or Git Bash (Windows)
- API keys for:
  - Foursquare Places API
  - Google Gemini AI API
- MongoDB Atlas connection string (or local MongoDB)

## Script Dependencies

These scripts work together and should be run in order for first-time setup:

```bash
# Complete setup flow
npm run setup
npm run configure  
npm run validate
```

## Troubleshooting

If scripts fail to execute:

1. Ensure they have executable permissions: `chmod +x scripts/*.sh`
2. Check that you're running from the project root directory
3. Verify you have the required API keys and credentials
4. Check the script output for specific error messages

## Development Notes

- Scripts are designed to be idempotent (safe to run multiple times)
- All scripts include error handling and user feedback
- Environment files are automatically backed up before modifications
- Scripts will not overwrite existing valid configurations unless explicitly requested
