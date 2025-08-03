#!/bin/bash

# ===========================================
# Quick API Key Setup Script
# ===========================================

echo "🔑 API Key Configuration Wizard"
echo "==============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to update environment variable
update_env_var() {
    local file=$1
    local var=$2
    local value=$3
    
    if [ -f "$file" ]; then
        if grep -q "^${var}=" "$file"; then
            # Variable exists, update it
            sed -i.bak "s|^${var}=.*|${var}=${value}|" "$file"
        else
            # Variable doesn't exist, add it
            echo "${var}=${value}" >> "$file"
        fi
        # Clean up backup file
        rm -f "${file}.bak"
    fi
}

# Setup Foursquare API
setup_foursquare() {
    echo ""
    print_info "Setting up Foursquare Places API..."
    echo ""
    echo "1. Visit: https://foursquare.com/developers/"
    echo "2. Create an account (free)"
    echo "3. Create a new app"
    echo "4. Copy your API key"
    echo ""
    
    read -p "Enter your Foursquare API key (or press Enter to skip): " foursquare_key
    
    if [ -n "$foursquare_key" ]; then
        update_env_var ".env" "FOURSQUARE_API_KEY" "$foursquare_key"
        update_env_var "server/.env" "FOURSQUARE_API_KEY" "$foursquare_key"
        print_status "Foursquare API key configured!"
    else
        print_warning "Skipped Foursquare API key setup"
    fi
}

# Setup Gemini API
setup_gemini() {
    echo ""
    print_info "Setting up Google Gemini AI API..."
    echo ""
    echo "1. Visit: https://aistudio.google.com/"
    echo "2. Create a Google account (if needed)"
    echo "3. Click 'Get API key'"
    echo "4. Create a new API key"
    echo "5. Copy your API key (starts with 'AIza')"
    echo ""
    
    read -p "Enter your Gemini AI API key (or press Enter to skip): " gemini_key
    
    if [ -n "$gemini_key" ]; then
        update_env_var ".env" "GEMINI_API_KEY" "$gemini_key"
        update_env_var "server/.env" "GEMINI_API_KEY" "$gemini_key"
        print_status "Gemini AI API key configured!"
    else
        print_warning "Skipped Gemini AI API key setup"
    fi
}

# Setup Google Maps (optional)
setup_google_maps() {
    echo ""
    print_info "Setting up Google Maps API (optional)..."
    echo ""
    echo "This enhances the map experience but is optional."
    echo "1. Visit: https://console.cloud.google.com/"
    echo "2. Enable Maps JavaScript API"
    echo "3. Create credentials (API key)"
    echo "4. Copy your API key"
    echo ""
    
    read -p "Enter your Google Maps API key (or press Enter to skip): " maps_key
    
    if [ -n "$maps_key" ]; then
        update_env_var "client/.env" "REACT_APP_GOOGLE_MAPS_API_KEY" "$maps_key"
        print_status "Google Maps API key configured!"
    else
        print_warning "Skipped Google Maps API key setup"
    fi
}

# Configure MongoDB
setup_mongodb() {
    echo ""
    print_info "MongoDB Configuration..."
    echo ""
    echo "Current MongoDB URI: mongodb://localhost:27017/recommendation-engine"
    echo ""
    echo "Options:"
    echo "1. Use local MongoDB (default)"
    echo "2. Use MongoDB Atlas (cloud)"
    echo "3. Use custom URI"
    echo ""
    
    read -p "Choose option (1-3) or press Enter for default: " mongo_option
    
    case $mongo_option in
        2)
            echo ""
            echo "For MongoDB Atlas:"
            echo "1. Visit: https://www.mongodb.com/atlas"
            echo "2. Create a free cluster"
            echo "3. Get connection string"
            echo ""
            read -p "Enter your MongoDB Atlas URI: " mongo_uri
            if [ -n "$mongo_uri" ]; then
                update_env_var ".env" "MONGODB_URI" "$mongo_uri"
                update_env_var "server/.env" "MONGODB_URI" "$mongo_uri"
                print_status "MongoDB Atlas URI configured!"
            fi
            ;;
        3)
            read -p "Enter your custom MongoDB URI: " mongo_uri
            if [ -n "$mongo_uri" ]; then
                update_env_var ".env" "MONGODB_URI" "$mongo_uri"
                update_env_var "server/.env" "MONGODB_URI" "$mongo_uri"
                print_status "Custom MongoDB URI configured!"
            fi
            ;;
        *)
            print_status "Using default local MongoDB"
            ;;
    esac
}

# Main setup flow
main() {
    echo "This wizard will help you configure the essential API keys."
    echo ""
    
    setup_foursquare
    setup_gemini
    setup_google_maps
    setup_mongodb
    
    echo ""
    echo "🎉 API Key Configuration Complete!"
    echo "=================================="
    echo ""
    print_info "Next steps:"
    echo "1. Run: ./validate-env.sh (to verify configuration)"
    echo "2. Run: npm run dev (to start the application)"
    echo ""
    print_info "Tip: You can run this script again anytime to update keys."
}

# Run main function
main
