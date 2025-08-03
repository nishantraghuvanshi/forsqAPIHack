#!/bin/bash

# ===========================================
# Environment Validation Script
# ===========================================

echo "🔍 Validating Environment Configuration..."
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

# Validation counters
ERRORS=0
WARNINGS=0

# Check if a variable is set in a file
check_env_var() {
    local file=$1
    local var=$2
    local required=$3
    local description=$4
    
    if [ -f "$file" ]; then
        if grep -q "^${var}=" "$file"; then
            local value=$(grep "^${var}=" "$file" | cut -d'=' -f2-)
            if [ -n "$value" ] && [ "$value" != "" ]; then
                print_status "$description is configured"
                return 0
            else
                if [ "$required" = "true" ]; then
                    print_error "$description is empty (required)"
                    ERRORS=$((ERRORS + 1))
                    return 1
                else
                    print_warning "$description is empty (optional)"
                    WARNINGS=$((WARNINGS + 1))
                    return 0
                fi
            fi
        else
            if [ "$required" = "true" ]; then
                print_error "$description is missing (required)"
                ERRORS=$((ERRORS + 1))
                return 1
            else
                print_warning "$description is missing (optional)"
                WARNINGS=$((WARNINGS + 1))
                return 0
            fi
        fi
    else
        print_error "File $file not found"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Validate main .env file
validate_main_env() {
    echo "📄 Validating main .env file..."
    
    check_env_var ".env" "FOURSQUARE_API_KEY" "true" "Foursquare API Key"
    check_env_var ".env" "GEMINI_API_KEY" "true" "Gemini AI API Key"
    check_env_var ".env" "JWT_SECRET" "true" "JWT Secret"
    check_env_var ".env" "SESSION_SECRET" "true" "Session Secret"
    check_env_var ".env" "MONGODB_URI" "true" "MongoDB URI"
    check_env_var ".env" "PORT" "false" "Server Port"
    check_env_var ".env" "NODE_ENV" "false" "Node Environment"
    
    echo ""
}

# Validate server .env file
validate_server_env() {
    echo "🖥️  Validating server/.env file..."
    
    check_env_var "server/.env" "FOURSQUARE_API_KEY" "true" "Server Foursquare API Key"
    check_env_var "server/.env" "GEMINI_API_KEY" "true" "Server Gemini AI API Key"
    check_env_var "server/.env" "JWT_SECRET" "true" "Server JWT Secret"
    check_env_var "server/.env" "MONGODB_URI" "true" "Server MongoDB URI"
    check_env_var "server/.env" "PORT" "false" "Server Port"
    check_env_var "server/.env" "CORS_ORIGIN" "false" "CORS Origin"
    check_env_var "server/.env" "GEMINI_MODEL" "false" "Gemini Model"
    
    echo ""
}

# Validate client .env file
validate_client_env() {
    echo "🌐 Validating client/.env file..."
    
    check_env_var "client/.env" "REACT_APP_API_URL" "true" "React App API URL"
    check_env_var "client/.env" "REACT_APP_PORT" "false" "React App Port"
    check_env_var "client/.env" "REACT_APP_GOOGLE_MAPS_API_KEY" "false" "Google Maps API Key"
    check_env_var "client/.env" "REACT_APP_NAME" "false" "App Name"
    check_env_var "client/.env" "REACT_APP_ENABLE_DEV_TOOLS" "false" "Dev Tools"
    
    echo ""
}

# Check API key format
validate_api_keys() {
    echo "🔑 Validating API key formats..."
    
    # Check Foursquare API key format
    if [ -f ".env" ]; then
        FOURSQUARE_KEY=$(grep "^FOURSQUARE_API_KEY=" .env | cut -d'=' -f2-)
        if [ -n "$FOURSQUARE_KEY" ]; then
            if [[ ${#FOURSQUARE_KEY} -ge 40 ]]; then
                print_status "Foursquare API key format appears valid"
            else
                print_warning "Foursquare API key seems too short (expected 40+ chars)"
                WARNINGS=$((WARNINGS + 1))
            fi
        fi
    fi
    
    # Check Gemini API key format
    if [ -f ".env" ]; then
        GEMINI_KEY=$(grep "^GEMINI_API_KEY=" .env | cut -d'=' -f2-)
        if [ -n "$GEMINI_KEY" ]; then
            if [[ $GEMINI_KEY == AIza* ]]; then
                print_status "Gemini API key format appears valid"
            else
                print_warning "Gemini API key should start with 'AIza'"
                WARNINGS=$((WARNINGS + 1))
            fi
        fi
    fi
    
    echo ""
}

# Check database connectivity
validate_database() {
    echo "🗄️  Validating database configuration..."
    
    if [ -f ".env" ]; then
        MONGODB_URI=$(grep "^MONGODB_URI=" .env | cut -d'=' -f2-)
        if [ -n "$MONGODB_URI" ]; then
            if [[ $MONGODB_URI == mongodb://* ]] || [[ $MONGODB_URI == mongodb+srv://* ]]; then
                print_status "MongoDB URI format is valid"
                
                # Try to connect to MongoDB (if mongosh is available)
                if command -v mongosh >/dev/null 2>&1; then
                    print_info "Testing MongoDB connection..."
                    if timeout 5 mongosh "$MONGODB_URI" --eval "db.runCommand('ping')" >/dev/null 2>&1; then
                        print_status "MongoDB connection successful"
                    else
                        print_warning "MongoDB connection failed (check if MongoDB is running)"
                        WARNINGS=$((WARNINGS + 1))
                    fi
                elif command -v mongo >/dev/null 2>&1; then
                    print_info "Testing MongoDB connection..."
                    if timeout 5 mongo "$MONGODB_URI" --eval "db.runCommand('ping')" >/dev/null 2>&1; then
                        print_status "MongoDB connection successful"
                    else
                        print_warning "MongoDB connection failed (check if MongoDB is running)"
                        WARNINGS=$((WARNINGS + 1))
                    fi
                else
                    print_info "MongoDB client not found, skipping connection test"
                fi
            else
                print_error "Invalid MongoDB URI format"
                ERRORS=$((ERRORS + 1))
            fi
        fi
    fi
    
    echo ""
}

# Check port availability
validate_ports() {
    echo "🔌 Checking port availability..."
    
    # Check server port (5000)
    if lsof -i :5000 >/dev/null 2>&1; then
        print_warning "Port 5000 is already in use"
        WARNINGS=$((WARNINGS + 1))
    else
        print_status "Port 5000 is available for server"
    fi
    
    # Check client port (3000)
    if lsof -i :3000 >/dev/null 2>&1; then
        print_warning "Port 3000 is already in use"
        WARNINGS=$((WARNINGS + 1))
    else
        print_status "Port 3000 is available for client"
    fi
    
    echo ""
}

# Generate validation report
generate_report() {
    echo "📊 Validation Summary"
    echo "===================="
    echo ""
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        print_status "All validations passed! ✨"
        echo ""
        print_info "Your environment is ready for development."
        echo "You can start the application with: npm run dev"
    elif [ $ERRORS -eq 0 ]; then
        print_warning "Validation completed with $WARNINGS warning(s)"
        echo ""
        print_info "Your environment should work, but check the warnings above."
        echo "You can start the application with: npm run dev"
    else
        print_error "Validation failed with $ERRORS error(s) and $WARNINGS warning(s)"
        echo ""
        print_info "Please fix the errors above before starting the application."
        echo ""
        print_info "Common fixes:"
        echo "1. Add your API keys to .env file"
        echo "2. Start MongoDB service"
        echo "3. Check port availability"
        echo ""
        exit 1
    fi
}

# Main validation flow
main() {
    echo "🔍 Environment Validation for Recommendation Engine"
    echo "================================================="
    echo ""
    
    validate_main_env
    validate_server_env
    validate_client_env
    validate_api_keys
    validate_database
    validate_ports
    generate_report
}

# Run main function
main
