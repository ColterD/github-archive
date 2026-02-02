// scripts/setup.ts
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

// Check if running in a CI environment
const isCI = process.env.CI === 'true';

/**
 * Setup script that runs after installation
 * - Creates necessary directories
 * - Sets up git hooks
 * - Installs additional dependencies if needed (skipped in CI environments)
 */
function setup() {
  console.log('🚀 Running setup script...');
  
  // Create necessary directories
  const dirs = [
    'docs/.vitepress/cache',
    'docs/content/blog',
    'docs/content/projects',
    'docs/content/guides',
    'docs/content/public',
  ];
  
  for (const dir of dirs) {
    const path = resolve(process.cwd(), dir);
    if (!existsSync(path)) {
      console.log(`📁 Creating directory: ${dir}`);
      mkdirSync(path, { recursive: true });
    }
  }
  
  // Setup git hooks if .git directory exists
  if (existsSync(resolve(process.cwd(), '.git'))) {
    try {
      console.log('🔧 Setting up git hooks...');
      execSync('npx husky install', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️ Failed to setup git hooks:', error);
    }
  }
  
  // Check for required dependencies
  if (!isCI) {
    try {
      console.log('🔍 Checking for required dependencies...');
      
      // Check if sharp is installed for image optimization
      try {
        require.resolve('sharp');
      } catch (e) {
        console.log('📦 Installing sharp for image optimization...');
        execSync('pnpm add -D sharp', { stdio: 'inherit' });
      }
      
      // Check if sitemap is installed
      try {
        require.resolve('sitemap');
      } catch (e) {
        console.log('📦 Installing sitemap for sitemap generation...');
        execSync('pnpm add -D sitemap', { stdio: 'inherit' });
      }
      
      // Check if fast-glob is installed
      try {
        require.resolve('fast-glob');
      } catch (e) {
        console.log('📦 Installing fast-glob for file pattern matching...');
        execSync('pnpm add -D fast-glob', { stdio: 'inherit' });
      }
      
      // Check if tsx is installed
      try {
        require.resolve('tsx');
      } catch (e) {
        console.log('📦 Installing tsx for TypeScript execution...');
        execSync('pnpm add -D tsx', { stdio: 'inherit' });
      }
    } catch (error) {
      console.warn('⚠️ Failed to check or install dependencies:', error);
    }
  } else {
    console.log('🔍 Skipping dependency installation in CI environment');
  }
  
  console.log('✅ Setup completed successfully!');
}

setup();