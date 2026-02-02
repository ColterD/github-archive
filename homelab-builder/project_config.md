# PROJECT CONFIGURATION - LONG TERM MEMORY

## PROJECT_IDENTITY

```yaml
NAME: "Homelab Hardware Platform"
VISION: "Community-driven hardware comparison platform for used/enterprise surplus market"
BUSINESS_MODEL: "Open-core (free core features + premium commercial features)"
TARGET_AUDIENCE: "Homelab enthusiasts, IT professionals, hardware vendors"
UNIQUE_VALUE: "Focus on enterprise surplus hardware with price optimization"
```

## TECH_STACK_REQUIREMENTS

```yaml
RUNTIME: "Node.js 20.x+"
FRAMEWORK: "SvelteKit 2.x + TypeScript 5.x"
BUILD_TOOL: "Vite 7.x"
PACKAGE_MANAGER: "PNPM 9.x+"
DATABASE: "PostgreSQL + Prisma ORM + pgvector for semantic search"
SEARCH_ENGINE: "Meilisearch for lightning-fast, typo-tolerant search"
AUTHENTICATION: "Auth.js for SvelteKit with role-based access control"
STYLING: "Tailwind CSS + shadcn-svelte"
ADMIN_TOOLS: "Chart.js for visualizations + WebSockets for real-time metrics"
EMAIL_SERVICE: "Resend for transactional emails and notifications"
MONITORING: "Sentry + OpenTelemetry for observability"
CACHING: "Redis for session management and caching"
IMAGE_PROCESSING: "Sharp for optimization + UploadThing for management"
SECURITY: "Helmet for security headers + rate-limiter-flexible"
HOSTING: "Railway (unified app + database)"
CDN: "Cloudflare for global performance and DDoS protection"
```

## ESTABLISHED_PATTERNS

```yaml
NAMING_CONVENTIONS:
  - Variables: "camelCase, descriptive names"
  - Functions: "camelCase, prefix events with 'handle'"
  - Components: "PascalCase.svelte"
  - Files: "lowercase-with-dashes"
  - Constants: "UPPER_SNAKE_CASE"

CODE_ORGANIZATION:
  - Single responsibility per component
  - Utility functions in $lib/utils
  - Types in $lib/types
  - Components in $lib/components
  - Server utilities in $lib/server
  - Database queries through Prisma only
  - Search operations through Meilisearch client
  - Email operations through Resend templates

UI_DESIGN_SYSTEM:
  - Theme: "Auto-detect dark/light mode with manual toggle"
  - Layout: "Card-based design inspired by PCPartPicker but distinct"
  - Typography: "Inter font family with 8px grid spacing system"
  - Colors: "Theme-aware neutral base with blue/green accent colors"
  - Components: "shadcn-svelte base with custom hardware-focused variants"
  - Icons: "Lucide icons throughout for consistency"
  - Responsive: "Mobile-first design with desktop enhancements"
  - Accessibility: "WCAG 2.1 AA compliance with excellent keyboard navigation"

SEARCH_PATTERNS:
  - Primary search: "Meilisearch for typo-tolerant, faceted search"
  - Semantic search: "pgvector for AI-powered similar item discovery"
  - Autocomplete: "Real-time suggestions with search analytics"
  - Search optimization: "Track queries and optimize results"

EMAIL_COMMUNICATION:
  - Transactional emails: "Resend with branded templates"
  - Email verification: "Required for all new accounts"
  - Notification preferences: "User-controlled email settings"
  - Email deliverability: "SPF, DKIM, DMARC configuration"

MONITORING_OBSERVABILITY:
  - Error tracking: "Sentry with user context and performance monitoring"
  - Distributed tracing: "OpenTelemetry for request flow analysis"
  - Business metrics: "Custom dashboards for KPIs and growth"
  - Real user monitoring: "Performance tracking for all users"

CONTENT_MODERATION:
  - AI moderation: "Automated content screening for reviews and builds"
  - User reporting: "Community-driven content flagging system"
  - Reputation system: "Trust scores for verified contributors"
  - Manual review: "Human moderation for edge cases"

INFORMATION_VERIFICATION:
  - Always verify package versions via web search before installation
  - Cross-reference implementation patterns with current documentation
  - Update project patterns when web search reveals better approaches
  - Document authoritative sources in memory files
  - Use MCP tools for real-time data and integrations

SECURITY_PATTERNS:
  - OAuth authentication only (no passwords)
  - Role-based access control (USER, ADMIN, MODERATOR roles)
  - Multi-layer security: "OWASP Top 10 compliance"
  - Input validation: "Zod schemas for all user inputs"
  - Database security: "Prisma for all operations, no raw SQL"
  - API protection: "Smart rate limiting per user/IP/endpoint"
  - Security headers: "Helmet.js for comprehensive protection"
  - Admin route protection: "Role verification with audit logging"
  - Vulnerability scanning: "Automated security audits with Snyk"
  - CSRF protection: "Token-based protection enabled by default"
  - Data protection: "GDPR compliance with privacy by design"

PERFORMANCE_PATTERNS:
  - Image optimization: "Sharp processing with dynamic resizing"
  - Caching strategy: "Multi-layer caching (Redis, CDN, browser)"
  - Database optimization: "Connection pooling, query optimization"
  - Asset optimization: "Brotli compression, lazy loading"
  - CDN integration: "Global edge caching with Cloudflare"
  - Background processing: "Queue system for heavy operations"
```

## ICON LIBRARY MANAGEMENT - CRITICAL FOR BUNDLE SIZE

### Lucide Icons Import Strategy

**NEVER import the entire Lucide library** - this will bundle ~1000+ icons (~1.2MB) client-side.

**WRONG - Causes massive bundles:**

```javascript
// ❌ BAD: Imports entire library
import { Sun, Moon } from "lucide-svelte";
// ❌ WORSE: Dynamic imports of entire library
const ThemeIcon = (await import("lucide-svelte")).Sun;
```

**CORRECT - Specific imports only:**

```javascript
// ✅ GOOD: Import only what you need
import Sun from "lucide-svelte/icons/sun";
import Moon from "lucide-svelte/icons/moon";
import User from "lucide-svelte/icons/user";
```

### Adding New Icons

When adding new features that require icons:

1. **Always** import specific icons: `import IconName from 'lucide-svelte/icons/icon-name'`
2. **Update** vite.config.ts chunking if needed
3. **Test** bundle size after changes
4. **Document** any new icon usage patterns

### Bundle Impact

- Specific imports: ~1-3KB per icon
- Full library import: ~1.2MB (1000+ icons)
- Target: Keep icon chunk under 100KB total

## PERFORMANCE_REQUIREMENTS

```yaml
PAGE_LOADS: "<2 seconds all pages"
API_RESPONSES: "<500ms average"
DATABASE_QUERIES: "<100ms average"
LIGHTHOUSE_SCORE: ">90 all categories"
MOBILE_PERFORMANCE: "First-class mobile experience"
CONCURRENT_USERS: "Support 500+ simultaneous users"
```

## BUSINESS_CONSTRAINTS

```yaml
OPEN_CORE_MODEL:
  FREE_FEATURES: "Hardware catalog, basic search, community builds"
  PREMIUM_FEATURES: "Advanced analytics, API access, deal alerts"

CONTENT_FOCUS:
  PRIMARY: "Enterprise surplus servers, storage, networking"
  SECONDARY: "Consumer hardware for homelab use"
  EXCLUDED: "Gaming hardware, mobile devices, consumer electronics"

COMMUNITY_RULES:
  - User-generated content requires moderation
  - Hardware verification system for accuracy
  - Review system with helpful/unhelpful voting
  - Build sharing with category organization
```

## SUCCESS_METRICS

```yaml
USER_GROWTH: "500+ registered users"
CONTENT_VOLUME: "1000+ hardware items in database"
COMMUNITY_ENGAGEMENT: "100+ shared builds"
CONVERSION_RATE: "5% free to premium conversion"
TECHNICAL_UPTIME: "99.9% availability"
```

## INTEGRATION_REQUIREMENTS

```yaml
EXTERNAL_APIS:
  EBAY: "Sold listings data for price tracking"
  OAUTH_PROVIDERS: "GitHub + Google authentication"
  NOTIFICATION: "Email alerts for price drops"

INTERNAL_SYSTEMS:
  DATABASE: "PostgreSQL with connection pooling"
  CACHE: "Redis for frequently accessed data"
  SEARCH: "Full-text search across hardware items"
  FILES: "Image storage and optimization"
```

## DEPLOYMENT_CONFIGURATION

```yaml
HOSTING_PLATFORM: "Railway"
DATABASE_HOSTING: "Railway PostgreSQL addon"
ENVIRONMENT_STAGES: "development, staging, production"
DOMAIN_STRATEGY: "Custom domain with SSL"
BACKUP_STRATEGY: "Automated daily PostgreSQL backups"
MONITORING_STACK: "Railway metrics + Sentry error tracking"
```

## RECENT_OPTIMIZATION_ACHIEVEMENTS - JANUARY 2025

```yaml
CODEBASE_CLEANUP:
  - "545 lines of dead code eliminated across 4 unused components"
  - "Debug console.log statements removed from production code"
  - "TypeScript type safety enhanced throughout application"
  - "Import optimization consolidated (formatDate from utils)"

PERFORMANCE_OPTIMIZATION:
  - "Bundle size: 157.22 kB gzipped (excellent performance)"
  - "Build time: 11-13 seconds consistently"
  - "Lucide icons: Properly chunked to prevent 1.2MB bloat"
  - "Font loading: 67% reduction maintained (6 vs 18 files)"

PRODUCTION_DEPLOYMENT:
  - "Railway deployment: LIVE and stable"
  - "Rate limiting: Fixed (30s → 5min admin refresh)"
  - "Migration repair: Multi-tier system working perfectly"
  - "GitHub OAuth: Configured and operational"

CODE_QUALITY:
  - "TypeScript errors: 21 → 0 (100% resolution)"
  - "ESLint issues: All warnings resolved"
  - "Build stability: Zero warnings or errors"
  - "Production readiness: Fully optimized"

COMPONENTS_REMOVED:
  - "LazyComponent.svelte (87 lines) - Unused lazy loading wrapper"
  - "LiveActivityFeed.svelte (156 lines) - Unused real-time feed"
  - "SearchSuggestions.svelte (134 lines) - Duplicate functionality"
  - "HardwareSkeleton.svelte (168 lines) - Unused loading skeleton"

FILES_OPTIMIZED:
  - "src/lib/components/ui/index.ts - Cleaned exports"
  - "src/lib/stores/admin.ts - Rate limiting fix"
  - "src/lib/stores/websocket.ts - Debug cleanup"
  - "src/routes/admin/+page.svelte - Type improvements"
  - "Multiple components - TypeScript enhancements"
```

## DEPENDENCY_UPDATE_STATUS - JANUARY 2025

```yaml
MAJOR_UPDATES_REQUIRED:
  - "@sentry/sveltekit: 8.55.0 → 9.38.0 (breaking changes)"
  - "tailwindcss: 3.4.0 → 4.1.11 (major version update)"
  - "vite: 6.3.5 → 7.0.4 (configuration changes needed)"
  - "zod: 3.25.76 → 4.0.5 (schema API changes)"

MINOR_UPDATES_SAFE:
  - "lucide-svelte: 0.400.0 → 0.525.0"
  - "meilisearch: 0.41.0 → 0.51.0"
  - "mode-watcher: 0.4.1 → 1.1.0"
  - "helmet: 7.2.0 → 8.1.0"

UPDATE_STRATEGY:
  - "Test safe updates first"
  - "Handle major versions individually"
  - "Verify breaking changes before deployment"
  - "Monitor bundle size during updates"
```

## TOKENIZATION_SETTINGS

```yaml
CHARACTERS_PER_TOKEN: 4
CONTEXT_WINDOW_MANAGEMENT: "Prioritize current milestone tasks"
MEMORY_OPTIMIZATION: "Compress historical decisions into patterns"
TOKEN_BUDGET_ALLOCATION: "70% current work, 20% context, 10% planning"
```
