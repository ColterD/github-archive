// docs/.vitepress/config/seo.ts
import type { HeadConfig } from 'vitepress';

// Repository configuration
export const REPO_OWNER = 'colterd';
export const REPO_NAME = 'colterplus';
export const REPO_BRANCH = 'main';
export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;

// SEO Configuration
export const seoConfig = {
  defaultTitle: 'Colter+ | My Digital Universe',
  description: 'My Digital Universe - Curated. Projects, blogs, and guides by Colter.',
  author: 'Colter',
  siteUrl: 'https://colter.plus',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterCreator: '@colterplus'
};

// JSON-LD structured data
export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${seoConfig.siteUrl}/#website`,
  'url': seoConfig.siteUrl,
  'name': 'Colter+',
  'description': seoConfig.description,
  'potentialAction': {
    '@type': 'SearchAction',
    'target': `${seoConfig.siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

export const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${seoConfig.siteUrl}/#person`,
  'name': seoConfig.author,
  'url': seoConfig.siteUrl,
  'sameAs': [
    `https://github.com/${REPO_OWNER}`,
    seoConfig.twitterCreator
  ]
};

// Generate SEO head tags
export function generateSeoTags(): HeadConfig[] {
  return [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'author', content: seoConfig.author }],
    ['meta', { property: 'og:title', content: seoConfig.defaultTitle }],
    ['meta', { property: 'og:description', content: seoConfig.description }],
    ['meta', { property: 'og:image', content: seoConfig.ogImage }],
    ['meta', { property: 'og:url', content: seoConfig.siteUrl }],
    ['meta', { name: 'twitter:card', content: seoConfig.twitterCard }],
    ['meta', { name: 'twitter:creator', content: seoConfig.twitterCreator }],
    // JSON-LD structured data
    ['script', { type: 'application/ld+json' }, JSON.stringify(websiteJsonLd)],
    ['script', { type: 'application/ld+json' }, JSON.stringify(personJsonLd)],
  ];
}