// docs/.vitepress/utils/sanitize.ts
import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS and other injection attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

/**
 * Sanitizes a URL to prevent javascript: protocol and other injection vectors
 * @param url URL to sanitize
 * @returns Sanitized URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const sanitized = url.trim();
  
  // Check for dangerous protocols (case-insensitive)
  const lowerUrl = sanitized.toLowerCase();
  if (lowerUrl.startsWith('javascript:') || 
      lowerUrl.startsWith('data:') || 
      lowerUrl.startsWith('vbscript:') ||
      lowerUrl.startsWith('file:')) {
    return '';
  }
  
  return sanitized;
}

/**
 * Configuration for DOMPurify
 */
const purifyConfig = {
  ALLOWED_TAGS: [
    // Basic formatting
    'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text formatting
    'b', 'i', 'strong', 'em', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
    // Lists
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    // Content
    'blockquote', 'pre', 'code', 'span', 'div',
    // Links and media
    'a', 'img', 
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id',
    'width', 'height', 'style'
  ],
  FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object', 'embed', 'base', 'form', 'input'],
  FORBID_ATTR: [
    // Event handlers
    'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown', 'onmouseup',
    'onkeydown', 'onkeypress', 'onkeyup', 'onfocus', 'onblur', 'onchange', 'onsubmit',
    // Other dangerous attributes
    'formaction', 'jsaction'
  ],
  ALLOW_ARIA_ATTR: true,
  ALLOW_DATA_ATTR: false, // Prevents data-* attributes which can be used for XSS
  ADD_URI_SAFE_ATTR: ['loading'], // For lazy loading images
  USE_PROFILES: { html: true }, // Use HTML profile
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  WHOLE_DOCUMENT: false,
  SANITIZE_DOM: true
};

/**
 * Sanitizes HTML content for safe rendering
 * Uses DOMPurify for comprehensive protection
 * @param html HTML content to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Client-side only (DOMPurify requires DOM)
  if (typeof window === 'undefined') {
    // For SSR, use a simplified sanitization
    // Note: This is less secure and only used during server rendering
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '')
      .replace(/on\w+=\w+/g, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<base\b[^>]*>/gi, '');
  }
  
  return DOMPurify.sanitize(html, purifyConfig);
}

/**
 * Sanitizes markdown content before rendering
 * @param markdown Markdown content
 * @returns Sanitized markdown
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  // Remove potentially dangerous markdown constructs
  return markdown
    // Prevent script injection via HTML in markdown
    .replace(/`{3}html[\s\S]*?`{3}/gi, '```\nHTML code block removed for security\n```')
    // Sanitize links that might contain javascript:
    .replace(/\[(.*?)\]\((javascript|data|vbscript|file):(.*?)\)/gi, '[$1](#)');
}

/**
 * Creates an HTML sanitizer function with custom configuration
 * @param customConfig Custom configuration to merge with default
 * @returns Sanitize function with custom config
 */
export function createCustomSanitizer(customConfig = {}) {
  return (html: string): string => {
    if (!html) return '';
    
    if (typeof window === 'undefined') {
      // Basic fallback for SSR
      return sanitizeHtml(html);
    }
    
    // Merge default config with custom config
    const config = { ...purifyConfig, ...customConfig };
    return DOMPurify.sanitize(html, config);
  };
}

/**
 * Utility to clean all user input in an object
 * @param obj Object containing user input
 * @returns Sanitized copy of the object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {} as Record<string, any>;
  
  const sanitized: Record<string, any> = { ...obj };
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    }
  });
  
  return sanitized as unknown as Record<string, any>;
}