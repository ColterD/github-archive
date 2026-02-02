# AI PROJECT DIRECTIVES - HOMELAB HARDWARE PLATFORM

## PROJECT PARAMETERS

```yaml
PROJECT_NAME: "Homelab Hardware Platform"
VISION: "Community-driven hardware comparison platform focusing on used/enterprise surplus market"
BUSINESS_MODEL: "Open-core (free core + premium commercial)"
DEVELOPMENT_MODEL: "Milestone-driven completion"
TARGET_USERS: "Homelab enthusiasts, IT professionals, hardware vendors"
```

## SUCCESS METRICS - TRACK AUTOMATICALLY

```yaml
# Realistic 2025 Launch Metrics
USER_MILESTONE: 100+ registered users (Month 1), 500+ (Month 6)
CONTENT_MILESTONE: 250+ hardware items (Month 1), 1000+ (Month 6)
COMMUNITY_MILESTONE: 25+ community builds (Month 1), 100+ (Month 6)
CONVERSION_MILESTONE: 2-3% conversion rate to premium (industry standard)
TECHNICAL_MILESTONE: <2.5s LCP, <100ms FID, <0.1 CLS, >90 Lighthouse score, 99.9% uptime
```

## MILESTONE PROGRESSION - COMPLETE IN SEQUENCE

### MILESTONE_1: FOUNDATION_COMPLETE

```yaml
STATUS: "COMPLETE"
COMPLETION_CRITERIA:
  - USER_AUTH: "GitHub/Google OAuth 100% functional with role-based access control"
  - HARDWARE_DATABASE: "Prisma schema deployed, 500+ test items seeded"
  - BASIC_SEARCH: "Name/model/category filtering working perfectly"
  - PRODUCT_PAGES: "Detailed specs display with images functional"
  - USER_PROFILES: "Hardware ownership tracking operational"
  - ADMIN_DASHBOARD: "Secured admin interface with key metrics and real-time monitoring"
  - UI_DESIGN_SYSTEM: "Modern theme system with auto dark/light mode detection"
  - PERFORMANCE_VALIDATED: "<2s page loads confirmed across all pages"
  - MOBILE_RESPONSIVE: "All components functional on mobile devices"
  - DEPLOYMENT_STABLE: "Railway deployment automated and reliable"

DEPENDENCIES: "None - foundational milestone"
VALIDATION_REQUIRED:
  - ✅ All TypeScript compilation errors resolved
  - ✅ All tests passing (unit + integration)
  - ✅ All linting rules satisfied
  - ✅ Build succeeds without warnings
  - ✅ Authentication flows tested with real OAuth providers
  - ✅ Role-based access control functioning (admin vs user permissions)
  - ✅ Admin dashboard displaying accurate real-time metrics
  - ✅ Database operations tested with real data
  - ✅ Performance benchmarks met on mobile and desktop
  - ✅ Security validation passed (input sanitization, CSRF protection, admin route protection)

BLOCKED_BY: []
BLOCKS: ["MILESTONE_2"]
```

### MILESTONE_2: COMMUNITY_COMPLETE

```yaml
STATUS: "IN_PROGRESS"
COMPLETION_CRITERIA:
  - BUILD_SYSTEM: "Create/share hardware configurations 100% functional"
  - REVIEW_SYSTEM: "Rate and review hardware items fully operational"
  - PRICE_TRACKING: "Manual price entry with history charts working"
  - BUILD_DISCOVERY: "Search and filter community builds functioning"
  - MOBILE_PWA: "Offline functionality and app-like experience deployed"
  - COMMUNITY_MODERATION: "Review approval and spam prevention active"

DEPENDENCIES: ["MILESTONE_1: FOUNDATION_COMPLETE"]
VALIDATION_REQUIRED:
  - ✅ Build creation/editing/sharing workflows tested
  - ✅ Review submission and display systems validated
  - ✅ Price tracking accuracy verified with test data
  - ✅ Build discovery algorithms returning relevant results
  - ✅ PWA functionality working offline
  - ✅ Community features load tested with concurrent users
  - ✅ Moderation tools preventing spam and abuse

BLOCKED_BY: ["MILESTONE_1"]
BLOCKS: ["MILESTONE_3"]
```

### MILESTONE_3: INTELLIGENCE_COMPLETE

```yaml
STATUS: "PENDING"
COMPLETION_CRITERIA:
  - EBAY_INTEGRATION: "Automated sold listing data collection operational"
  - PRICE_ANALYTICS: "Trend analysis and predictions accurate >80%"
  - ALERT_SYSTEM: "Price drop and deal notifications delivering reliably"
  - ADVANCED_SEARCH: "Specification-based filtering returning precise results"
  - PERFORMANCE_METRICS: "Benchmark integration displaying accurate comparisons"
  - DATA_VALIDATION: "External data cleaned and normalized automatically"

DEPENDENCIES: ["MILESTONE_2: COMMUNITY_COMPLETE"]
VALIDATION_REQUIRED:
  - ✅ eBay API integration handling rate limits and errors gracefully
  - ✅ Price prediction algorithms tested against historical data
  - ✅ Alert delivery confirmed via email and push notifications
  - ✅ Advanced search filters returning expected results
  - ✅ Benchmark data integration displaying accurately
  - ✅ Data quality maintained with automated validation
  - ✅ External API failures handled with fallback systems

BLOCKED_BY: ["MILESTONE_2"]
BLOCKS: ["MILESTONE_4"]
```

### MILESTONE_4: MONETIZATION_COMPLETE

```yaml
STATUS: "PENDING"
COMPLETION_CRITERIA:
  - PREMIUM_FEATURES: "Advanced analytics dashboards fully functional"
  - API_ACCESS: "Developer API with authentication and rate limiting"
  - EXPORT_TOOLS: "CSV/JSON data exports working for all data types"
  - SUBSCRIPTION_SYSTEM: "Payment processing and user tier management"
  - WHITE_LABEL: "Private instance deployment capabilities"
  - ENTERPRISE_READY: "Multi-tenant architecture and admin tools"

DEPENDENCIES: ["MILESTONE_3: INTELLIGENCE_COMPLETE"]
VALIDATION_REQUIRED:
  - ✅ Premium feature access control functioning correctly
  - ✅ API rate limiting and authentication tested thoroughly
  - ✅ Export functionality generating valid data files
  - ✅ Payment integration processing transactions successfully
  - ✅ White-label deployment process documented and tested
  - ✅ Enterprise features supporting multiple organizations
  - ✅ Revenue tracking and analytics reporting accurately

BLOCKED_BY: ["MILESTONE_3"]
BLOCKS: []
```

## CURRENT_FOCUS - MILESTONE_1_TASKS

```yaml
ACTIVE_TASKS:
  SETUP_MEMORY_SYSTEM:
    STATUS: "IN_PROGRESS"
    COMPLETION: "Create project_config.md + workflow_state.md functional"

  SVELTEKIT_CONFIGURATION:
    STATUS: "PENDING"
    COMPLETION: "TypeScript + Tailwind + shadcn-svelte + modern UI system configured and tested"
    DEPENDENCIES: ["SETUP_MEMORY_SYSTEM"]

  AUTH_IMPLEMENTATION:
    STATUS: "PENDING"
    COMPLETION: "GitHub/Google OAuth login/logout flows 100% functional with role-based access"
    DEPENDENCIES: ["SVELTEKIT_CONFIGURATION"]

  DATABASE_SCHEMA:
    STATUS: "PENDING"
    COMPLETION: "Prisma schema designed, migrated, seeded with test data including admin tables"
    DEPENDENCIES: ["SVELTEKIT_CONFIGURATION"]

  HARDWARE_LISTING:
    STATUS: "PENDING"
    COMPLETION: "Hardware item display with modern card design, dark/light theme support"
    DEPENDENCIES: ["DATABASE_SCHEMA", "AUTH_IMPLEMENTATION"]

  SEARCH_FUNCTIONALITY:
    STATUS: "PENDING"
    COMPLETION: "Text search with real-time suggestions and theme-aware UI"
    DEPENDENCIES: ["HARDWARE_LISTING"]

  USER_PROFILES:
    STATUS: "PENDING"
    COMPLETION: "User dashboard with modern design and theme detection"
    DEPENDENCIES: ["AUTH_IMPLEMENTATION", "HARDWARE_LISTING"]

  ADMIN_DASHBOARD:
    STATUS: "PENDING"
    COMPLETION: "Secured admin interface with real-time metrics, charts, and theme support"
    DEPENDENCIES: ["AUTH_IMPLEMENTATION", "DATABASE_SCHEMA", "HARDWARE_LISTING"]

  RAILWAY_INTEGRATION:
    STATUS: "PENDING"
    COMPLETION: "GitHub connected to Railway, environment variables set, auto-deploy working"
    DEPENDENCIES: ["AUTH_IMPLEMENTATION", "DATABASE_SCHEMA"]
```

## DATABASE_SCHEMA_MILESTONE_1

```sql
-- CORE PLATFORM TABLES
users (id, email, name, avatar, role, reputation_score, email_verified, created_at, updated_at, last_login_at)
categories (id, name, slug, description, parent_id, sort_order, item_count)
manufacturers (id, name, slug, website, logo_url, verified, created_at)
hardware_items (id, name, model, category_id, manufacturer_id, specifications_json, images_json, status, search_vector, created_at, updated_at)
user_hardware (id, user_id, hardware_item_id, status, purchase_price, purchase_date, notes, verified)

-- ADMIN & SECURITY TABLES
admin_actions (id, admin_user_id, action_type, resource_type, resource_id, details_json, ip_address, created_at)
system_metrics (id, metric_name, metric_value, metadata_json, recorded_at)
security_events (id, event_type, user_id, ip_address, user_agent, details_json, severity, created_at)
rate_limits (id, identifier, endpoint, request_count, window_start, created_at)

-- SEARCH & ANALYTICS TABLES
search_queries (id, user_id, query, results_count, click_through_rate, created_at)
user_sessions (id, user_id, session_id, ip_address, user_agent, created_at, last_activity)
page_views (id, user_id, session_id, path, referrer, created_at)

-- COMMUNICATION TABLES
email_logs (id, user_id, template_id, subject, status, sent_at, opened_at, clicked_at)
notifications (id, user_id, type, title, message, read_at, created_at)

-- CONTENT MODERATION TABLES
content_reports (id, reporter_id, content_type, content_id, reason, status, reviewed_by, created_at)
moderation_actions (id, moderator_id, content_type, content_id, action_type, reason, created_at)

-- VALIDATION REQUIRED
- All foreign key constraints functional with proper cascading
- JSON validation for specifications, images, and metadata
- Full-text search indexes with pgvector for semantic search
- GIN indexes for JSONB columns and search performance
- Partial indexes for frequently queried filtered data
- Role enum: USER, ADMIN, MODERATOR with proper constraints
- Admin action logging triggers functional
- Search vector updates automated with triggers
- Seed data includes 500+ realistic hardware items with proper categorization
- Default admin user created with secure initial password
- Email templates seeded for all transactional emails
```

## API_ENDPOINTS_MILESTONE_1

```yaml
# REQUIRED FOR COMPLETION
GET /api/hardware:
  FUNCTION: "List hardware with pagination/filters"
  VALIDATION: "Returns properly formatted JSON with correct pagination"

GET /api/hardware/[id]:
  FUNCTION: "Hardware details with specifications"
  VALIDATION: "Returns complete hardware data including images and specs"

GET /api/categories:
  FUNCTION: "Category tree structure"
  VALIDATION: "Returns hierarchical category data"

GET /api/manufacturers:
  FUNCTION: "Manufacturer list"
  VALIDATION: "Returns manufacturer data with logos and website links"

POST /api/auth/*:
  FUNCTION: "Authentication endpoints"
  VALIDATION: "OAuth flows complete successfully with session creation"

GET /api/users/profile:
  FUNCTION: "User profile and owned hardware"
  VALIDATION: "Returns user data and associated hardware items"

POST /api/hardware/claim:
  FUNCTION: "User claims hardware ownership"
  VALIDATION: "Creates user_hardware relationship correctly"

# ADMIN ENDPOINTS (ROLE-PROTECTED)
GET /api/admin/dashboard:
  FUNCTION: "Admin dashboard metrics and system health"
  VALIDATION: "Returns user stats, content metrics, performance data"
  SECURITY: "Admin role required, audit logged"

GET /api/admin/users:
  FUNCTION: "User management with pagination and filtering"
  VALIDATION: "Returns user list with registration dates and activity"
  SECURITY: "Admin role required, audit logged"

GET /api/admin/metrics/realtime:
  FUNCTION: "Real-time system metrics via WebSocket"
  VALIDATION: "Streams live user count, performance metrics"
  SECURITY: "Admin role required, secure WebSocket connection"

GET /api/admin/activity:
  FUNCTION: "Recent user activity and system events"
  VALIDATION: "Returns timestamped activity feed"
  SECURITY: "Admin role required, audit logged"

POST /api/admin/users/[id]/role:
  FUNCTION: "Update user role (promote/demote admin)"
  VALIDATION: "Role change applied and audit logged"
  SECURITY: "Admin role required, audit logged"
```

## COMPLETION_VALIDATION_CHECKLIST

```yaml
# RUN BEFORE MARKING ANY MILESTONE COMPLETE
TECHNICAL_VALIDATION:
  - ✅ TypeScript compilation: 0 errors
  - ✅ ESLint validation: 0 violations
  - ✅ Build process: Succeeds without warnings
  - ✅ Test suite: 100% passing (unit + integration + e2e)
  - ✅ Performance: All pages load under 2 seconds
  - ✅ Mobile responsiveness: Functional on all screen sizes
  - ✅ Security scan: No vulnerabilities detected
  - ✅ Database integrity: All constraints and relationships valid

FUNCTIONAL_VALIDATION:
  - ✅ User workflows: All user journeys tested end-to-end
  - ✅ Admin workflows: Admin dashboard access and functionality tested
  - ✅ Edge cases: Error handling tested and functional
  - ✅ Data validation: Input sanitization preventing malicious data
  - ✅ Authentication: OAuth providers tested with real accounts
  - ✅ Authorization: Role-based access control functioning (admin vs user)
  - ✅ Real-time metrics: WebSocket connections delivering live data
  - ✅ Search accuracy: Returns relevant results for test queries
  - ✅ Data persistence: Database operations confirmed reliable
  - ✅ Admin security: Protected routes rejecting unauthorized access

DEPLOYMENT_VALIDATION:
  - ✅ Production environment: Matches development functionality
  - ✅ Environment variables: All required configs present
  - ✅ Database migrations: Applied successfully in production
  - ✅ SSL certificates: HTTPS functional and secure
  - ✅ Monitoring: Health checks and error tracking active
  - ✅ Backup systems: Database backups confirmed working
```

## MILESTONE_DEPENDENCIES_MAP

```
MILESTONE_1 (Foundation)
    ↓
MILESTONE_2 (Community)
    ↓
MILESTONE_3 (Intelligence)
    ↓
MILESTONE_4 (Monetization)
```

## AUTONOMOUS_PROGRESSION_RULES

```yaml
MILESTONE_ADVANCEMENT:
  - NEVER advance to next milestone until current milestone 100% validated
  - RUN complete validation checklist before marking milestone complete
  - RESOLVE all blocking issues before proceeding
  - UPDATE milestone status only after all criteria verified
  - DOCUMENT any architectural decisions affecting future milestones

COMPLETION_AUTHORITY:
  - AI has authority to mark individual tasks complete after validation
  - AI must run full validation checklist before milestone completion
  - All technical debt must be resolved before milestone advancement
  - No compromises on completion criteria - 100% functional required
```

EXECUTE MILESTONE_1 TASKS IN DEPENDENCY ORDER. VALIDATE THOROUGHLY BEFORE PROGRESSION.
