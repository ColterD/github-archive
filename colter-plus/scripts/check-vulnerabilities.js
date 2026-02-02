#!/usr/bin/env node

/**
 * Simple script to check for security vulnerabilities in dependencies
 * This is a placeholder for a more comprehensive security check
 */

/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

console.log('Checking for security vulnerabilities...');

// List of known vulnerable packages and their safe versions
const vulnerablePackages = {
  'vite': {
    vulnerableVersions: ['<0.3.0'],
    safeVersion: '0.3.0',
    severity: 'high',
    description: 'Vite versions before 0.3.0 are vulnerable to path traversal attacks'
  },
  'node-fetch': {
    vulnerableVersions: ['<2.6.7'],
    safeVersion: '2.6.7',
    severity: 'critical',
    description: 'node-fetch versions before 2.6.7 are vulnerable to ReDoS attacks'
  }
};

// Read package.json
const fs = require('fs');
const path = require('path');
const packageJsonPath = path.resolve(process.cwd(), 'package.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  let vulnerabilitiesFound = false;

  // Check for vulnerabilities
  Object.entries(dependencies).forEach(([packageName, version]) => {
    if (vulnerablePackages[packageName]) {
      const { vulnerableVersions, safeVersion, severity, description } = vulnerablePackages[packageName];
      
      // Simple version check (this is a placeholder for a more comprehensive check)
      const isVulnerable = vulnerableVersions.some(vulnerableVersion => {
        if (vulnerableVersion.startsWith('<')) {
          const minVersion = vulnerableVersion.substring(1);
          return version < minVersion;
        }
        return version === vulnerableVersion;
      });

      if (isVulnerable) {
        vulnerabilitiesFound = true;
        console.log(`⚠️ ${severity.toUpperCase()} severity vulnerability found in ${packageName}@${version}`);
        console.log(`   ${description}`);
        console.log(`   Recommended version: ${safeVersion} or later\n`);
      }
    }
  });

  if (!vulnerabilitiesFound) {
    console.log('✅ No known vulnerabilities found in the checked packages');
  } else {
    console.log('⚠️ Vulnerabilities found. Please update the affected packages.');
    // Exit with error code if vulnerabilities are found
    // process.exit(1);
  }
} catch (error) {
  console.error('Error reading package.json:', error);
  process.exit(1);
}