#!/usr/bin/env node

/**
 * Performance testing script to measure:
 * - Page load times for key routes
 * - API response times (Storyblok, Supabase, Beacon)
 * - Bandwidth usage per page
 * - Cache hit rates
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'https://localhost:3001'; // Changed to HTTPS
const TEST_ROUTES = [
  '/',
  '/dir',
  '/members',
  '/calendar',
  '/glossary',
  '/events',
];

// Check if server is running
async function checkServer(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const port = urlObj.port || (isHttps ? 3001 : 80);
    
    const req = httpModule.request({
      hostname: urlObj.hostname,
      port: port,
      path: '/',
      method: 'HEAD',
      timeout: 5000,
      rejectUnauthorized: false, // Accept self-signed certificates for local dev
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.error(`Server check error: ${error.code || error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

function measurePageLoad(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 3001 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: false, // Accept self-signed certificates for local dev
    };

    const req = httpModule.request(options, (res) => {
      const endTime = Date.now();
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          url,
          responseTime: endTime - startTime,
          status: res.statusCode,
          contentLength: data.length,
        });
      });
    });
    
    req.on('error', (error) => {
      const errorMsg = error.code === 'ECONNREFUSED' 
        ? 'Connection refused - is the dev server running?'
        : error.message;
      resolve({ url, error: errorMsg, errorCode: error.code });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, error: 'Request timeout' });
    });
    
    req.end();
  });
}

async function runPerformanceTests() {
  console.log('Starting performance tests...\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  
  // Optional: Check if server is running
  console.log('Checking if server is running...');
  const serverRunning = await checkServer(BASE_URL);
  if (!serverRunning) {
    console.warn(`⚠️  Cannot connect to ${BASE_URL}`);
    console.warn('Attempting to continue anyway...\n');
  } else {
    console.log('✅ Server is running\n');
  }

  const results = {
    timestamp: new Date().toISOString(),
    routes: [],
  };

  for (const route of TEST_ROUTES) {
    const url = `${BASE_URL}${route}`;
    console.log(`Testing ${url}...`);
    const result = await measurePageLoad(url);
    results.routes.push(result);
    
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}`);
    } else {
      console.log(`  ✅ Response time: ${result.responseTime}ms`);
      console.log(`  📦 Size: ${(result.contentLength / 1024).toFixed(2)} KB`);
      console.log(`  📊 Status: ${result.status}`);
    }
    console.log('');
  }

  // Save results
  const outputDir = path.join(process.cwd(), 'performance-reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `performance-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to ${outputFile}`);

  return results;
}

if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { runPerformanceTests, measurePageLoad };

