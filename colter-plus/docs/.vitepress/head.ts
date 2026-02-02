import type { HeadConfig } from 'vitepress';

// CSP configuration based on environment
const getCSPDirectives = (mode: string): string => {
  // Base CSP directives for all environments
  const baseDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "https:"],
    'font-src': ["'self'", "data:"],
    'connect-src': ["'self'"]
  };

  // Additional directives for development
  if (mode === 'development') {
    baseDirectives['connect-src'].push('ws:');
    baseDirectives['script-src'].push("'unsafe-eval'");
  }
  
  // Production might need additional services like analytics
  if (mode === 'production') {
    baseDirectives['connect-src'].push('https://analytics.example.com');
    // Add any other production-specific directives
  }

  // Convert directives object to string
  return Object.entries(baseDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// Get current mode from environment
const mode = process.env.NODE_ENV || 'production';

export const securityHeaders: HeadConfig[] = [
  ['meta', {
    'http-equiv': 'Content-Security-Policy',
    content: getCSPDirectives(mode)
  }],
  ['meta', {
    'http-equiv': 'X-Content-Type-Options',
    content: 'nosniff'
  }],
  ['meta', {
    'http-equiv': 'X-Frame-Options',
    content: 'DENY'
  }],
  ['meta', {
    'http-equiv': 'Permissions-Policy',
    content: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  }]
];