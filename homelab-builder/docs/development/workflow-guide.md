# Development Workflow Guide

## Project Overview

**Name:** Homelab Hardware Platform  
**Vision:** Community-driven hardware comparison platform for used/enterprise surplus market  
**Business Model:** Open-core (free core features + premium commercial features)  
**Target Audience:** Homelab enthusiasts, IT professionals, hardware vendors

## Current Status

**Milestone:** MILESTONE_1: FOUNDATION_COMPLETE ✅  
**Phase:** VALIDATED  
**Current Task:** Begin MILESTONE_2: Database and Authentication Integration

## Development Phases

### Phase Structure

Each development cycle follows a structured approach:

1. **ANALYZE** - Understanding and context gathering
2. **BLUEPRINT** - Detailed planning and architecture
3. **CONSTRUCT** - Implementation following the plan
4. **VALIDATE** - Comprehensive testing and verification

### Milestone Progression

```
MILESTONE_1 (Foundation) ✅
    ↓
MILESTONE_2 (Community) 🔄
    ↓
MILESTONE_3 (Intelligence) ⏳
    ↓
MILESTONE_4 (Monetization) ⏳
```

## Tech Stack Standards

### Core Technologies

- **Runtime:** Node.js 20.x+
- **Framework:** SvelteKit 2.x + TypeScript 5.x
- **Build Tool:** Vite 7.x
- **Package Manager:** PNPM 9.x+
- **Database:** PostgreSQL + Prisma ORM + pgvector
- **Search Engine:** Meilisearch
- **Authentication:** Auth.js with role-based access control
- **Styling:** Tailwind CSS + shadcn-svelte
- **Hosting:** Railway

### Code Standards

**Naming Conventions:**

- Variables: `camelCase`, descriptive names
- Functions: `camelCase`, prefix events with 'handle'
- Components: `PascalCase.svelte`
- Files: `lowercase-with-dashes`
- Constants: `UPPER_SNAKE_CASE`

**Code Organization:**

- Single responsibility per component
- Utility functions in `$lib/utils`
- Types in `$lib/types`
- Components in `$lib/components`
- Server utilities in `$lib/server`
- Database queries through Prisma only

## UI Design System

**Theme System:**

- Auto-detect dark/light mode with manual toggle
- CSS custom properties for theme variables
- Theme persistence in localStorage with system fallback

**Layout Principles:**

- Card-based design (distinct from PCPartPicker)
- Inter font family with 8px grid spacing system
- Theme-aware neutral base with blue/green accents
- shadcn-svelte base with hardware-focused variants
- Lucide icons throughout for consistency
- Mobile-first responsive design
- WCAG 2.1 AA compliance

## Performance Requirements

- **Page loads:** <2 seconds all pages
- **API responses:** <500ms average
- **Database queries:** <100ms average
- **Lighthouse score:** >90 all categories
- **Mobile performance:** First-class mobile experience
- **Concurrent users:** Support 500+ simultaneous users

## Security Patterns

- **Authentication:** OAuth only (no passwords)
- **Authorization:** Role-based access control (USER, ADMIN, MODERATOR)
- **Input validation:** Zod schemas for all user inputs
- **Database security:** Prisma for all operations, no raw SQL
- **API protection:** Smart rate limiting per user/IP/endpoint
- **Security headers:** Helmet.js for comprehensive protection
- **Admin protection:** Role verification with audit logging
- **CSRF protection:** Token-based protection enabled by default

## Development Rules

### Information Verification

- Always verify package versions via web search before installation
- Cross-reference implementation patterns with current documentation
- Update project patterns when web search reveals better approaches
- Document authoritative sources in memory files

### Session Initialization

When starting new work:

1. Read `project_config.md` for long-term context
2. Read `workflow_state.md` for current session state
3. Assess current milestone progress
4. Identify next actionable task with satisfied dependencies

### Error Recovery

- Automatically diagnose error type and cause
- Apply appropriate fix based on error pattern
- Re-run validation after fix
- Continue development if fix successful
- Document error and solution for future reference
- Maximum 3 attempts per error

## Testing Strategy

### Validation Checklist

Before marking any milestone complete:

**Technical Validation:**

- ✅ TypeScript compilation: 0 errors
- ✅ ESLint validation: 0 violations
- ✅ Build process: Succeeds without warnings
- ✅ Test suite: 100% passing (unit + integration + e2e)
- ✅ Performance: All pages load under 2 seconds
- ✅ Mobile responsiveness: Functional on all screen sizes
- ✅ Security scan: No vulnerabilities detected
- ✅ Database integrity: All constraints and relationships valid

**Functional Validation:**

- ✅ User workflows: All user journeys tested end-to-end
- ✅ Admin workflows: Dashboard access and functionality tested
- ✅ Edge cases: Error handling tested and functional
- ✅ Data validation: Input sanitization preventing malicious data
- ✅ Authentication: OAuth providers tested with real accounts
- ✅ Authorization: Role-based access control functioning
- ✅ Real-time metrics: WebSocket connections delivering live data

## Business Constraints

### Open Core Model

- **Free Features:** Hardware catalog, basic search, community builds
- **Premium Features:** Advanced analytics, API access, deal alerts

### Content Focus

- **Primary:** Enterprise surplus servers, storage, networking
- **Secondary:** Consumer hardware for homelab use
- **Excluded:** Gaming hardware, mobile devices, consumer electronics

### Success Metrics

- **User Growth:** 500+ registered users
- **Content Volume:** 1000+ hardware items in database
- **Community Engagement:** 100+ shared builds
- **Conversion Rate:** 5% free to premium conversion
- **Technical Uptime:** 99.9% availability

## Current Milestone Tasks

### MILESTONE_2: Database and Authentication Integration

**Status:** IN_PROGRESS

**Active Tasks:**

1. ✅ Design comprehensive Prisma schema - COMPLETED
2. 🔄 Implement Auth.js with GitHub/Google OAuth - ANALYZE_PHASE
3. ⏳ Create user registration and profile management system
4. ⏳ Build admin dashboard with real-time metrics
5. ⏳ Setup Railway deployment with environment variables
6. ⏳ Implement comprehensive testing suite

**Dependencies:** FOUNDATION_COMPLETE ✅

## File Structure Standards

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   │   └── ui/        # shadcn-svelte components
│   ├── server/        # Server-side utilities
│   │   ├── auth.ts    # Authentication logic
│   │   ├── db.ts      # Database connection
│   │   └── services/  # Business logic
│   ├── stores/        # Svelte stores
│   ├── types/         # TypeScript definitions
│   └── utils/         # Utility functions
├── routes/            # SvelteKit routes
│   ├── admin/         # Admin-only routes
│   ├── api/           # API endpoints
│   └── auth/          # Authentication routes
└── test/              # Test setup
```

## Deployment Configuration

**Environment Stages:** development, staging, production  
**Hosting Platform:** Railway  
**Database:** Railway PostgreSQL addon  
**Domain Strategy:** Custom domain with SSL  
**Backup Strategy:** Automated daily PostgreSQL backups  
**Monitoring:** Railway metrics + Sentry error tracking

## Contributing Guidelines

1. Follow the established code patterns and naming conventions
2. Ensure all tests pass before committing
3. Run linting and formatting tools
4. Update documentation for new features
5. Use the structured development phases (ANALYZE → BLUEPRINT → CONSTRUCT → VALIDATE)
6. Never advance to next milestone until current milestone is 100% validated

## Memory Management

**Context Window Management:** Prioritize current milestone tasks  
**Memory Optimization:** Compress historical decisions into patterns  
**Token Budget:** 70% current work, 20% context, 10% planning

This workflow ensures consistent, high-quality development while maintaining the project's architectural vision and business objectives.
