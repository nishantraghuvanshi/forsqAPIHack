#!/bin/bash

# ===========================================
# Recommendation Engine - Complete Test
# ===========================================

echo "🧪 Testing Recommendation Engine Setup..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Test environment validation
test_environment() {
    echo "🔍 Testing Environment Configuration..."
    
    if [ -f "scripts/validate-env.js" ]; then
        node scripts/validate-env.js
        if [ $? -eq 0 ]; then
            print_status "Environment validation passed"
        else
            print_error "Environment validation failed"
            echo "Please fix environment issues before continuing"
            exit 1
        fi
    else
        print_error "scripts/validate-env.js not found"
        exit 1
    fi
}

# Test server startup
test_server() {
    echo ""
    echo "🚀 Testing Server Startup..."
    
    if [ -d "server" ]; then
        cd server
        
        # Check if TypeScript compiles
        if command -v npx >/dev/null 2>&1; then
            print_info "Testing TypeScript compilation..."
            npx tsc --noEmit --project . 2>/dev/null
            if [ $? -eq 0 ]; then
                print_status "TypeScript compilation successful"
            else
                print_error "TypeScript compilation failed"
                cd ..
                return 1
            fi
        fi
        
        # Test server startup (quick test)
        print_info "Testing server startup..."
        timeout 10s npm run dev > /dev/null 2>&1 &
        SERVER_PID=$!
        sleep 5
        
        # Test health endpoint
        if command -v curl >/dev/null 2>&1; then
            curl -s http://localhost:5000/health > /dev/null
            if [ $? -eq 0 ]; then
                print_status "Server started successfully"
                kill $SERVER_PID 2>/dev/null
            else
                print_error "Server health check failed"
                kill $SERVER_PID 2>/dev/null
                cd ..
                return 1
            fi
        else
            print_info "curl not available, skipping health check"
            kill $SERVER_PID 2>/dev/null
        fi
        
        cd ..
    else
        print_error "Server directory not found"
        return 1
    fi
}

# Test client setup
test_client() {
    echo ""
    echo "🎨 Testing Client Setup..."
    
    if [ -d "client" ]; then
        cd client
        
        # Check if React builds
        if [ -f "package.json" ]; then
            print_info "Testing React build..."
            timeout 30s npm run build > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                print_status "React build successful"
            else
                print_error "React build failed"
                cd ..
                return 1
            fi
        fi
        
        cd ..
    else
        print_error "Client directory not found"
        return 1
    fi
}

# Test API endpoints
test_api_endpoints() {
    echo ""
    echo "🔗 Testing API Endpoints..."
    
    if command -v curl >/dev/null 2>&1; then
        # Start server in background
        cd server
        npm run dev > /dev/null 2>&1 &
        SERVER_PID=$!
        cd ..
        
        sleep 8
        
        # Test health endpoint
        print_info "Testing /health endpoint..."
        HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)
        if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
            print_status "Health endpoint working"
        else
            print_error "Health endpoint failed"
        fi
        
        # Test search endpoint (with mock data)
        print_info "Testing /api/places/search endpoint..."
        SEARCH_RESPONSE=$(curl -s "http://localhost:5000/api/places/search?query=coffee&lat=40.7128&lng=-74.0060")
        if echo "$SEARCH_RESPONSE" | grep -q "places"; then
            print_status "Search endpoint working"
        else
            print_error "Search endpoint failed"
        fi
        
        # Clean up
        kill $SERVER_PID 2>/dev/null
    else
        print_info "curl not available, skipping API tests"
    fi
}

# Generate test report
generate_report() {
    echo ""
    echo "📊 Test Summary"
    echo "==============="
    echo ""
    
    if [ $ENV_TEST -eq 0 ] && [ $SERVER_TEST -eq 0 ] && [ $CLIENT_TEST -eq 0 ]; then
        print_status "All tests passed! 🎉"
        echo ""
        echo "Your Recommendation Engine is ready to use!"
        echo ""
        echo "Next steps:"
        echo "1. Start development: npm run dev"
        echo "2. Visit http://localhost:3000 for the frontend"
        echo "3. Visit http://localhost:5000/health for backend health"
        echo ""
    else
        print_error "Some tests failed"
        echo ""
        echo "Issues found:"
        [ $ENV_TEST -ne 0 ] && echo "- Environment configuration issues"
        [ $SERVER_TEST -ne 0 ] && echo "- Server startup issues"
        [ $CLIENT_TEST -ne 0 ] && echo "- Client build issues"
        echo ""
        echo "Please fix the issues above and run the test again."
    fi
}

# Main test flow
main() {
    echo "🔬 Comprehensive Setup Test"
    echo "=========================="
    
    # Initialize test results
    ENV_TEST=1
    SERVER_TEST=1
    CLIENT_TEST=1
    
    # Run tests
    test_environment && ENV_TEST=0
    test_server && SERVER_TEST=0
    test_client && CLIENT_TEST=0
    test_api_endpoints
    
    # Generate report
    generate_report
    
    # Exit with appropriate code
    if [ $ENV_TEST -eq 0 ] && [ $SERVER_TEST -eq 0 ] && [ $CLIENT_TEST -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run if called directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
