#!/usr/bin/env node

/**
 * Environment Validation Utility
 * Validates all required environment variables from central .env file
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Required environment variables
const requiredVars = {
  server: [
    'FOURSQUARE_API_KEY',
    'GEMINI_API_KEY',
    'JWT_SECRET',
    'MONGODB_URI'
  ],
  client: [
    'REACT_APP_API_URL'
  ],
  optional: [
    'GOOGLE_MAPS_API_KEY',
    'REACT_APP_GOOGLE_MAPS_API_KEY',
    'REDIS_URL',
    'SMTP_HOST',
    'SENTRY_DSN'
  ]
};

// Load environment file
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        envVars[key.trim()] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    return null;
  }
}

// Check if a value looks like a placeholder
function isPlaceholder(value) {
  const placeholders = [
    'your-',
    'your_',
    'change-this',
    'replace-with',
    'add-your',
    'paste-your',
    'insert-your'
  ];
  
  return placeholders.some(placeholder => 
    value.toLowerCase().includes(placeholder)
  );
}

// Validate environment variables
function validateEnv(envVars, requiredKeys, label) {
  console.log(`\n${colors.cyan}📋 Checking ${label} Environment Variables${colors.reset}`);
  console.log('=' .repeat(50));
  
  let missingCount = 0;
  let placeholderCount = 0;
  let validCount = 0;
  
  requiredKeys.forEach(key => {
    const value = envVars[key];
    
    if (!value || value === '') {
      console.log(`${colors.red}✗${colors.reset} ${key}: ${colors.red}MISSING${colors.reset}`);
      missingCount++;
    } else if (isPlaceholder(value)) {
      console.log(`${colors.yellow}⚠${colors.reset} ${key}: ${colors.yellow}PLACEHOLDER${colors.reset} (${value.substring(0, 30)}...)`);
      placeholderCount++;
    } else {
      console.log(`${colors.green}✓${colors.reset} ${key}: ${colors.green}SET${colors.reset}`);
      validCount++;
    }
  });
  
  return { missingCount, placeholderCount, validCount };
}

// Check optional variables
function checkOptionalVars(envVars, optionalKeys) {
  console.log(`\n${colors.cyan}📋 Optional Environment Variables${colors.reset}`);
  console.log('=' .repeat(50));
  
  optionalKeys.forEach(key => {
    const value = envVars[key];
    
    if (!value || value === '') {
      console.log(`${colors.blue}○${colors.reset} ${key}: ${colors.blue}NOT SET${colors.reset} (optional)`);
    } else if (isPlaceholder(value)) {
      console.log(`${colors.yellow}⚠${colors.reset} ${key}: ${colors.yellow}PLACEHOLDER${colors.reset} (${value.substring(0, 30)}...)`);
    } else {
      console.log(`${colors.green}✓${colors.reset} ${key}: ${colors.green}SET${colors.reset}`);
    }
  });
}

// Display API key setup instructions
function showApiInstructions() {
  console.log(`\n${colors.cyan}🔑 API Key Setup Instructions${colors.reset}`);
  console.log('=' .repeat(50));
  
  console.log(`\n${colors.yellow}Foursquare Places API:${colors.reset}`);
  console.log('1. Visit: https://foursquare.com/developers/');
  console.log('2. Sign up/in and create a new app');
  console.log('3. Copy your API key');
  console.log('4. Add to .env: FOURSQUARE_API_KEY=your-actual-key');
  
  console.log(`\n${colors.yellow}Google Gemini AI API:${colors.reset}`);
  console.log('1. Visit: https://aistudio.google.com/');
  console.log('2. Sign up/in and get your API key');
  console.log('3. Add to .env: GEMINI_API_KEY=your-actual-key');
  
  console.log(`\n${colors.yellow}Optional - Google Maps API:${colors.reset}`);
  console.log('1. Visit: https://console.cloud.google.com/');
  console.log('2. Enable Maps JavaScript API');
  console.log('3. Create credentials');
  console.log('4. Add to .env: REACT_APP_GOOGLE_MAPS_API_KEY=your-actual-key');
}

// Main validation function
function main() {
  console.log(`${colors.cyan}🔍 Environment Configuration Validator${colors.reset}`);
  console.log('=' .repeat(50));
  
  // Check if central .env file exists
  const centralEnvPath = '.env';
  
  if (!fs.existsSync(centralEnvPath)) {
    console.log(`${colors.red}\n✗ Central .env file not found!${colors.reset}`);
    console.log(`Run ${colors.cyan}npm run setup${colors.reset} to create it.`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓${colors.reset} Found central .env file: ${centralEnvPath}`);
  
  const envVars = loadEnvFile(centralEnvPath);
  if (!envVars) {
    console.log(`${colors.red}\n✗ Failed to load .env file!${colors.reset}`);
    process.exit(1);
  }
  
  // Validate required variables
  const serverResults = validateEnv(envVars, requiredVars.server, 'Required Server');
  const clientResults = validateEnv(envVars, requiredVars.client, 'Required Client');
  
  // Check optional variables
  checkOptionalVars(envVars, requiredVars.optional);
  
  // Summary
  console.log(`\n${colors.cyan}📊 Validation Summary${colors.reset}`);
  console.log('=' .repeat(50));
  
  const totalRequired = requiredVars.server.length + requiredVars.client.length;
  const totalMissing = serverResults.missingCount + clientResults.missingCount;
  const totalPlaceholders = serverResults.placeholderCount + clientResults.placeholderCount;
  const totalValid = serverResults.validCount + clientResults.validCount;
  
  console.log(`Total Required Variables: ${totalRequired}`);
  console.log(`${colors.green}✓ Valid: ${totalValid}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Placeholders: ${totalPlaceholders}${colors.reset}`);
  console.log(`${colors.red}✗ Missing: ${totalMissing}${colors.reset}`);
  
  // Status and recommendations
  if (totalMissing > 0) {
    console.log(`\n${colors.red}❌ Configuration Incomplete${colors.reset}`);
    console.log(`${totalMissing} required variables are missing.`);
    showApiInstructions();
    process.exit(1);
  } else if (totalPlaceholders > 0) {
    console.log(`\n${colors.yellow}⚠️  Configuration Needs Attention${colors.reset}`);
    console.log(`${totalPlaceholders} variables still have placeholder values.`);
    showApiInstructions();
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ Configuration Complete!${colors.reset}`);
    console.log('All required environment variables are properly set.');
    console.log(`\nYou can now start the application with: ${colors.cyan}npm run dev${colors.reset}`);
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateEnv, loadEnvFile };
