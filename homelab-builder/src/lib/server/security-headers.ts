// SECURITY HEADERS - Enhanced Security Configuration
// Provides comprehensive security headers for production deployment
// Updated: 2025-01-09 - Added security headers configuration

import type { Handle } from "@sveltejs/kit";
import { env } from "./env";
import { logger } from "./logger";

interface SecurityConfig {
  contentSecurityPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
    reportOnly: boolean;
  };
  headers: Record<string, string>;
  development: {
    relaxedCSP: boolean;
    allowUnsafeEval: boolean;
  };
}

// Security configuration
const securityConfig: SecurityConfig = {
  contentSecurityPolicy: {
    enabled: true,
    reportOnly: env.NODE_ENV === "development",
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        // Only allow unsafe directives in development
        ...(env.NODE_ENV === "development" ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
        "https://fonts.googleapis.com",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com",
      ],
      "style-src": [
        "'self'",
        // Only allow unsafe-inline in development for CSS-in-JS and Tailwind
        ...(env.NODE_ENV === "development" ? ["'unsafe-inline'"] : []),
        "https://fonts.googleapis.com",
      ],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "https:",
        // Only allow http in development
        ...(env.NODE_ENV === "development" ? ["http:"] : []),
      ],
      "connect-src": [
        "'self'",
        "https://api.github.com",
        "https://accounts.google.com",
        "https://www.google-analytics.com",
        "https://sentry.io", // For error reporting
        ...(env.NODE_ENV === "development" ? ["ws://localhost:*", "http://localhost:*"] : []),
      ],
      "frame-src": ["'self'", "https://accounts.google.com"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "upgrade-insecure-requests": [],
    },
  },
  headers: {
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Enable XSS protection
    "X-XSS-Protection": "1; mode=block",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions policy
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),

    // HSTS (only in production with HTTPS)
    ...(env.NODE_ENV === "production"
      ? {
          "Strict-Transport-Security":
            "max-age=31536000; includeSubDomains; preload",
        }
      : {}),

    // Cross-Origin policies
    "Cross-Origin-Embedder-Policy": "credentialless",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  },
  development: {
    relaxedCSP: true,
    allowUnsafeEval: true,
  },
};

// Generate CSP header value
function generateCSPHeader(
  config: SecurityConfig["contentSecurityPolicy"],
): string {
  const directives = Object.entries(config.directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(" ")}`;
    })
    .join("; ");

  return directives;
}

// Generate nonce for inline scripts/styles
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

// Security headers middleware
export const securityHeaders: Handle = async ({ event, resolve }) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip security headers for API routes that need different policies
  const skipPaths = ["/api/health", "/api/metrics"];
  const shouldSkip = skipPaths.some((path) => url.pathname.startsWith(path));

  if (shouldSkip) {
    return resolve(event);
  }

  // Generate nonce for this request
  const nonce = generateNonce();
  event.locals.nonce = nonce;

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => {
      // Inject nonce into inline scripts and styles
      return html
        .replace(/<script(?![^>]*src)/g, `<script nonce="${nonce}"`)
        .replace(/<style(?![^>]*href)/g, `<style nonce="${nonce}"`);
    },
  });

  // Apply security headers
  Object.entries(securityConfig.headers).forEach(([header, value]) => {
    response.headers.set(header, value);
  });

  // Apply CSP header
  if (securityConfig.contentSecurityPolicy.enabled) {
    const cspConfig = { ...securityConfig.contentSecurityPolicy };

    // Add nonce to script-src and style-src
    cspConfig.directives = {
      ...cspConfig.directives,
      "script-src": [...cspConfig.directives["script-src"], `'nonce-${nonce}'`],
      "style-src": [...cspConfig.directives["style-src"], `'nonce-${nonce}'`],
    };

    // Relax CSP in development
    if (
      env.NODE_ENV === "development" &&
      securityConfig.development.relaxedCSP
    ) {
      cspConfig.directives["script-src"].push("'unsafe-eval'");
      cspConfig.directives["connect-src"].push(
        "ws://localhost:*",
        "http://localhost:*",
      );
    }

    const cspHeader = generateCSPHeader(cspConfig);
    const headerName = cspConfig.reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";

    response.headers.set(headerName, cspHeader);
  }

  // Log security headers application
  logger.debug("Security headers applied", {
    url: url.pathname,
    headers: Object.keys(securityConfig.headers),
    csp: securityConfig.contentSecurityPolicy.enabled,
    nonce: nonce.substring(0, 8) + "...",
  });

  return response;
};

// CSP violation reporting endpoint helper
export function handleCSPViolation(report: Record<string, unknown>) {
  logger.warn("CSP violation reported", {
    blockedURI: report["blocked-uri"],
    violatedDirective: report["violated-directive"],
    originalPolicy: report["original-policy"],
    documentURI: report["document-uri"],
    sourceFile: report["source-file"],
    lineNumber: report["line-number"],
    columnNumber: report["column-number"],
  });
}

// Export configuration for testing/debugging
export { securityConfig };

// Utility to check if a URL is allowed by CSP
export function isAllowedByCSP(url: string, directive: string): boolean {
  const sources =
    securityConfig.contentSecurityPolicy.directives[directive] || [];

  // Check if URL matches any allowed source
  return sources.some((source) => {
    if (source === "'self'") {
      return url.startsWith(env.ORIGIN || "http://localhost");
    }
    if (source === "'unsafe-inline'" || source === "'unsafe-eval'") {
      return false; // These don't apply to external URLs
    }
    if (source.startsWith("https://") || source.startsWith("http://")) {
      return url.startsWith(source);
    }
    return false;
  });
}
