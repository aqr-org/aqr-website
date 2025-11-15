#!/usr/bin/env node

/**
 * Bundle size analysis script
 * Uses @next/bundle-analyzer to analyze bundle sizes
 */

const { execSync } = require('child_process');

console.log('Analyzing bundle size...');
console.log('Building with bundle analyzer...\n');

try {
  execSync(
    'ANALYZE=true npm run build',
    { stdio: 'inherit', env: { ...process.env, ANALYZE: 'true' } }
  );
  console.log('\nBundle analysis complete! Check the .next/analyze directory for reports.');
} catch (error) {
  console.error('Error running bundle analysis:', error.message);
  process.exit(1);
}

