#!/usr/bin/env node

/**
 * Simple bundle analyzer for monitoring bundle size improvements
 * Run with: node scripts/bundle-analyzer.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const buildDir = join(projectRoot, '.svelte-kit', 'output', 'client');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('🔍 Analyzing bundle size...\n');

  const manifestPath = join(buildDir, 'manifest.json');
  
  if (!existsSync(manifestPath)) {
    console.log('❌ Build not found. Run `npm run build` first.');
    return;
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    
    let totalSize = 0;
    const chunks = [];

    // Analyze chunks
    for (const [path, info] of Object.entries(manifest)) {
      if (info.file && existsSync(join(buildDir, info.file))) {
        const stats = readFileSync(join(buildDir, info.file));
        const size = stats.length;
        totalSize += size;
        
        chunks.push({
          path,
          file: info.file,
          size,
          isEntry: info.isEntry || false,
          isDynamicEntry: info.isDynamicEntry || false
        });
      }
    }

    // Sort by size
    chunks.sort((a, b) => b.size - a.size);

    console.log('📊 Bundle Analysis Results:');
    console.log('=' .repeat(60));
    console.log(`Total Bundle Size: ${formatBytes(totalSize)}\n`);

    console.log('📦 Largest Chunks:');
    console.log('-'.repeat(60));
    
    chunks.slice(0, 10).forEach((chunk, index) => {
      const percentage = ((chunk.size / totalSize) * 100).toFixed(1);
      const type = chunk.isEntry ? '[ENTRY]' : chunk.isDynamicEntry ? '[DYNAMIC]' : '[CHUNK]';
      
      console.log(`${index + 1}. ${chunk.file}`);
      console.log(`   ${formatBytes(chunk.size)} (${percentage}%) ${type}`);
      console.log(`   Route: ${chunk.path}`);
      console.log('');
    });

    // Analyze by type
    const entryChunks = chunks.filter(c => c.isEntry);
    const dynamicChunks = chunks.filter(c => c.isDynamicEntry);
    const regularChunks = chunks.filter(c => !c.isEntry && !c.isDynamicEntry);

    console.log('📈 Bundle Breakdown:');
    console.log('-'.repeat(60));
    console.log(`Entry Chunks: ${entryChunks.length} files, ${formatBytes(entryChunks.reduce((sum, c) => sum + c.size, 0))}`);
    console.log(`Dynamic Chunks: ${dynamicChunks.length} files, ${formatBytes(dynamicChunks.reduce((sum, c) => sum + c.size, 0))}`);
    console.log(`Regular Chunks: ${regularChunks.length} files, ${formatBytes(regularChunks.reduce((sum, c) => sum + c.size, 0))}`);

    // Recommendations
    console.log('\n💡 Optimization Recommendations:');
    console.log('-'.repeat(60));
    
    const largeChunks = chunks.filter(c => c.size > 100 * 1024); // > 100KB
    if (largeChunks.length > 0) {
      console.log('• Consider code splitting for large chunks:');
      largeChunks.slice(0, 3).forEach(chunk => {
        console.log(`  - ${chunk.file} (${formatBytes(chunk.size)})`);
      });
    }

    const totalDynamicSize = dynamicChunks.reduce((sum, c) => sum + c.size, 0);
    const dynamicPercentage = ((totalDynamicSize / totalSize) * 100).toFixed(1);
    
    if (dynamicPercentage < 30) {
      console.log('• Consider adding more dynamic imports to improve initial load time');
    } else {
      console.log(`✅ Good dynamic chunk ratio: ${dynamicPercentage}% of total bundle`);
    }

    if (totalSize > 1024 * 1024) { // > 1MB
      console.log('• Bundle size is large. Consider:');
      console.log('  - Tree shaking unused dependencies');
      console.log('  - Using lighter alternatives for heavy libraries');
      console.log('  - Implementing more aggressive code splitting');
    } else {
      console.log(`✅ Bundle size looks good: ${formatBytes(totalSize)}`);
    }

  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
  }
}

// Performance tracking
function trackPerformance() {
  const packageJsonPath = join(projectRoot, 'package.json');
  
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    
    console.log('\n📋 Dependency Summary:');
    console.log('-'.repeat(60));
    console.log(`Production Dependencies: ${dependencies.length}`);
    console.log(`Development Dependencies: ${devDependencies.length}`);
    
    // Check for heavy dependencies
    const heavyDeps = dependencies.filter(dep => 
      ['chart.js', 'three', 'monaco-editor', 'codemirror'].includes(dep)
    );
    
    if (heavyDeps.length > 0) {
      console.log(`Heavy Dependencies Detected: ${heavyDeps.join(', ')}`);
      console.log('💡 Ensure these are lazy loaded or tree-shaken properly');
    }
  }
}

// Main execution
console.log('🚀 Homelab Hardware Platform - Bundle Analyzer\n');
analyzeBundle();
trackPerformance();

console.log('\n✨ Analysis complete!');
console.log('💡 Tip: Run this after each optimization to track improvements');