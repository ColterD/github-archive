// Lighthouse CI Configuration for Performance Monitoring
// Updated for 2025 Core Web Vitals and performance standards

export default {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: "pnpm run preview",
      startServerReadyPattern: "Local:",
      url: ["http://localhost:4173"],
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals (2025 Standards)
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "first-input-delay": ["error", { maxNumericValue: 100 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],

        // Performance Metrics
        "speed-index": ["error", { maxNumericValue: 3000 }],
        "first-contentful-paint": ["error", { maxNumericValue: 1800 }],
        interactive: ["error", { maxNumericValue: 3500 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],

        // Lighthouse Scores (2025 Standards)
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],

        // Security Headers
        "csp-xss": "off", // Handled by our CSP configuration
        "is-on-https": "error",

        // Modern Web Standards
        "uses-http2": "error",
        "uses-optimized-images": "error",
        "efficient-animated-content": "error",
        "modern-image-formats": "error",
        "preload-lcp-image": "error",

        // JavaScript Optimization
        "unused-javascript": ["warn", { maxNumericValue: 50000 }],
        "unused-css-rules": ["warn", { maxNumericValue: 20000 }],
        "legacy-javascript": "error",

        // Network Optimization
        "uses-text-compression": "error",
        "uses-rel-preconnect": "error",
        "prioritize-lcp-image": "error",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-reports",
    },
  },
};
