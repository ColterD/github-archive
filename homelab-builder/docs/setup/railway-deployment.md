# Railway Deployment Guide

## Environment Variables Required

### Core Application

```bash
# Database (automatically provided by Railway)
DATABASE_URL="postgresql://user:password@host:port/database"

# Auth.js Configuration
AUTH_SECRET="your-32-character-secret"
NEXTAUTH_URL="https://your-app.railway.app"

# GitHub OAuth
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
```

### Optional Services

```bash
# Meilisearch (Railway add-on)
MEILISEARCH_HOST="https://your-meilisearch.railway.app"
MEILISEARCH_MASTER_KEY="your-master-key"

# Redis (Railway add-on)
REDIS_URL="redis://default:password@host:port"

# Email (Resend)
RESEND_API_KEY="re_your-api-key"

# Error Tracking (Sentry)
SENTRY_DSN="https://your-dsn@sentry.io/project"
```

## Deployment Configuration

### nixpacks.toml

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "postgresql_16", "python39", "gcc", "pkg-config", "openssl"]

[phases.build]
cmds = ["pnpm install --frozen-lockfile", "pnpm run build"]

[phases.start]
cmd = "pnpm run start"

[variables]
NODE_ENV = "production"
NIXPACKS_METADATA = "nodejs,postgresql"
```

### Build Script

The `pnpm run build` command:

1. Generates Prisma client
2. Builds SvelteKit application
3. Optimizes for production

### Start Script

The `pnpm run start` command:

1. Runs database migrations
2. Starts Node.js server on PORT (Railway provides this)

## Common Deployment Issues

### 1. Build Failures

**Issue**: `"Input" is not exported` errors
**Solution**: Fixed by updating component exports in `src/lib/components/ui/input/index.ts`

### 2. Database Connection

**Issue**: Database connection fails
**Solution**: Ensure DATABASE_URL is set correctly by Railway PostgreSQL add-on

### 3. Missing Dependencies

**Issue**: `gcc` or `postgresql_16` not found
**Solution**: nixpacks.toml includes all required system dependencies

### 4. Port Configuration

**Issue**: Application not accessible
**Solution**: Railway automatically sets PORT environment variable

## Health Check Endpoint

Railway monitors `/health` endpoint:

- Database connectivity
- Redis status (if configured)
- Meilisearch status (if configured)
- Email service status
- System resources

## Monitoring

### Railway Metrics

- CPU usage
- Memory usage
- Network traffic
- Response times

### Application Metrics

- Error rates via Sentry
- Performance via built-in monitoring
- Real-time stats via WebSocket

## Troubleshooting

### Check Deployment Logs

```bash
# View build logs in Railway dashboard
# Check for TypeScript errors
# Verify all dependencies installed
```

### Verify Environment Variables

```bash
# Ensure all required variables are set
# Check DATABASE_URL format
# Verify OAuth credentials
```

### Test Health Endpoint

```bash
curl https://your-app.railway.app/health
```

## Performance Optimization

### Build Optimization

- Tree shaking enabled
- Code splitting
- Asset optimization
- Gzip compression

### Runtime Optimization

- Connection pooling
- Redis caching
- Image optimization
- CDN integration

## Security

### Headers

- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

### Authentication

- Secure session management
- OAuth2 with GitHub/Google
- CSRF protection
- Rate limiting

## Scaling

### Horizontal Scaling

Railway supports automatic scaling based on:

- CPU usage
- Memory usage
- Request volume

### Database Scaling

- Connection pooling via Prisma
- Read replicas (if needed)
- Query optimization

## Backup & Recovery

### Database Backups

Railway provides automatic PostgreSQL backups:

- Daily snapshots
- Point-in-time recovery
- Cross-region replication

### Application Backups

- Git-based deployment
- Rollback capabilities
- Environment variable versioning
