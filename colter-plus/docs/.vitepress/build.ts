// docs/.vitepress/build.ts
import { resolve } from 'path';
import { generateSitemap } from './utils/sitemap';
import { generateRSS } from './utils/rss';

const BASE_URL = 'https://colter.plus';
const DIST_DIR = resolve(__dirname, 'dist');
const CONTENT_DIR = resolve(__dirname, '../content');

async function build() {
  try {
    console.log('Starting build post-processing...');
    
    // Generate sitemap
    console.log('Generating sitemap...');
    await generateSitemap(BASE_URL, DIST_DIR, CONTENT_DIR);
    
    // Generate RSS feed
    console.log('Generating RSS feed...');
    await generateRSS(BASE_URL, DIST_DIR, CONTENT_DIR);
    
    console.log('Build post-processing completed successfully!');
  } catch (error) {
    console.error('Error during build post-processing:', error);
    process.exit(1);
  }
}

build();