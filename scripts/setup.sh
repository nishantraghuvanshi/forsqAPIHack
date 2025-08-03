#!/bin/bash

# ===========================================
# Recommendation Engine - Environment Setup
# ===========================================

echo "🚀 Setting up Recommendation Engine Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if .env files exist
check_env_files() {
    echo "📁 Checking environment files..."
    
    # Main .env file
    if [ ! -f ".env" ]; then
        print_status ".env file already created with default values"
    else
        print_info ".env file exists, keeping current configuration"
    fi
    
    # Server .env file  
    if [ ! -f "server/.env" ]; then
        print_status "server/.env file already created with default values"
    else
        print_info "server/.env file exists, keeping current configuration"
    fi
    
    # Client .env file
    if [ ! -f "client/.env" ]; then
        print_status "client/.env file already created with default values"
    else
        print_info "client/.env file exists, keeping current configuration"
    fi
    
    print_info "All .env files are ready for development"
}

# Check Node.js version
check_node() {
    echo ""
    echo "🔍 Checking Node.js..."
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_status "Node.js $NODE_VERSION (compatible)"
        else
            print_error "Node.js $NODE_VERSION found, but version 18+ required"
            exit 1
        fi
    else
        print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

# Check MongoDB
check_mongodb() {
    echo ""
    echo "🔍 Checking MongoDB..."
    
    if command -v mongod >/dev/null 2>&1; then
        print_status "MongoDB installed"
    elif command -v docker >/dev/null 2>&1; then
        print_info "MongoDB not found locally, but Docker is available"
        print_info "You can run MongoDB with: docker run -d -p 27017:27017 mongo"
    else
        print_warning "MongoDB not found. Install from https://www.mongodb.com/try/download/community"
        print_info "Alternatively, use MongoDB Atlas cloud database"
    fi
}

# Install dependencies
install_dependencies() {
    echo ""
    echo "📦 Installing dependencies..."
    
    # Root dependencies
    if [ -f "package.json" ]; then
        print_info "Installing root dependencies..."
        npm install
        if [ $? -eq 0 ]; then
            print_status "Root dependencies installed"
        else
            print_error "Failed to install root dependencies"
            exit 1
        fi
    fi
    
    # Server dependencies
    if [ -d "server" ] && [ -f "server/package.json" ]; then
        print_info "Installing server dependencies..."
        cd server
        npm install
        if [ $? -eq 0 ]; then
            print_status "Server dependencies installed"
        else
            print_error "Failed to install server dependencies"
            exit 1
        fi
        cd ..
    fi
    
    # Client dependencies
    if [ -d "client" ] && [ -f "client/package.json" ]; then
        print_info "Installing client dependencies..."
        cd client
        npm install
        if [ $? -eq 0 ]; then
            print_status "Client dependencies installed"
        else
            print_error "Failed to install client dependencies"
            exit 1
        fi
        cd ..
    fi
}

# Generate random secrets
generate_secrets() {
    echo ""
    echo "🔐 Generating secure secrets..."
    
    # Generate strong secrets
    JWT_SECRET="rec_engine_jwt_$(openssl rand -hex 32 2>/dev/null || head /dev/urandom | tr -dc A-Za-z0-9 | head -c 64)"
    SESSION_SECRET="rec_engine_session_$(openssl rand -hex 32 2>/dev/null || head /dev/urandom | tr -dc A-Za-z0-9 | head -c 64)"
    
    # Update main .env file
    if [ -f ".env" ]; then
        # Replace JWT_SECRET
        if grep -q "JWT_SECRET=" .env; then
            sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        else
            echo "JWT_SECRET=$JWT_SECRET" >> .env
        fi
        
        # Replace SESSION_SECRET
        if grep -q "SESSION_SECRET=" .env; then
            sed -i.bak "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
        else
            echo "SESSION_SECRET=$SESSION_SECRET" >> .env
        fi
        
        print_status "Generated secure secrets in main .env"
    fi
    
    # Update server .env file
    if [ -f "server/.env" ]; then
        if grep -q "JWT_SECRET=" server/.env; then
            sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" server/.env
        else
            echo "JWT_SECRET=$JWT_SECRET" >> server/.env
        fi
        
        if grep -q "SESSION_SECRET=" server/.env; then
            sed -i.bak "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" server/.env
        else
            echo "SESSION_SECRET=$SESSION_SECRET" >> server/.env
        fi
        
        print_status "Generated secure secrets in server/.env"
    fi
    
    # Clean up backup files
    rm -f .env.bak server/.env.bak 2>/dev/null
}

# Display API key setup instructions
show_api_instructions() {
    echo ""
    echo "🔑 API Key Setup Required:"
    echo "----------------------------------------"
    echo ""
    print_info "1. Foursquare Places API:"
    echo "   - Visit: https://foursquare.com/developers/"
    echo "   - Create an account and new app"
    echo "   - Copy your API key"
    echo "   - Add to .env: FOURSQUARE_API_KEY=your-key-here"
    echo ""
    print_info "2. Google Gemini AI API:"
    echo "   - Visit: https://aistudio.google.com/"
    echo "   - Create an account"
    echo "   - Generate an API key"
    echo "   - Add to .env: GEMINI_API_KEY=your-key-here"
    echo ""
    print_info "3. Optional - Google Maps API (for enhanced maps):"
    echo "   - Visit: https://console.cloud.google.com/"
    echo "   - Enable Maps JavaScript API"
    echo "   - Create credentials"
    echo "   - Add to client/.env: REACT_APP_GOOGLE_MAPS_API_KEY=your-key-here"
    echo ""
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    print_info "Next Steps:"
    echo ""
    echo "1. Configure your API keys:"
    echo "   ./configure-api-keys.sh"
    echo ""
    echo "2. Validate your environment:"
    echo "   ./validate-env.sh"
    echo ""
    echo "3. Start the development servers:"
    echo "   npm run dev"
    echo ""
    print_info "Quick Commands:"
    echo "   npm run setup         # Run this setup again"
    echo "   npm run dev           # Start both servers"
    echo "   npm run dev:server    # Backend only (http://localhost:5000)"
    echo "   npm run dev:client    # Frontend only (http://localhost:3000)"
    echo "   npm run build         # Build for production"
    echo "   npm run test          # Run tests"
    echo ""
    print_info "Health Checks:"
    echo "   Backend:  http://localhost:5000/health"
    echo "   Frontend: http://localhost:3000"
    echo ""
    print_info "Configuration Files:"
    echo "   Main:     .env (central configuration)"
    echo "   Server:   server/.env (backend settings)"
    echo "   Client:   client/.env (frontend settings)"
    echo ""
    print_info "API Documentation:"
    echo "   Search:   http://localhost:5000/api/places/search?query=coffee&lat=40.7128&lng=-74.0060"
    echo "   Nearby:   http://localhost:5000/api/places/nearby?lat=40.7128&lng=-74.0060"
    echo "   Trending: http://localhost:5000/api/places/trending?lat=40.7128&lng=-74.0060"
    echo ""
}

# Main setup flow
main() {
    echo "🏗️  Recommendation Engine Setup Script"
    echo "====================================="
    
    check_node
    check_mongodb
    check_env_files
    install_dependencies
    generate_secrets
    show_api_instructions
    show_next_steps
    
    echo ""
    print_status "Setup completed successfully!"
    echo ""
}

# Run main function
main
