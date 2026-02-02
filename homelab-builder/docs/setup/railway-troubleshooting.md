# Railway Deployment Troubleshooting Guide

## Common Deployment Issues & Solutions

### 1. P3009 Migration Error - "Failed migrations in target database"

**Error Message:**

```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20250110000000_init` migration started at 2025-07-11 19:01:22.752692 UTC failed
```

**Root Cause:**

- Migration started but failed to complete
- Database is in inconsistent state
- Prisma migration tracking table has failed migration record

**Solutions (Applied in Order):**

#### Method 1: Resolve Specific Migration

```bash
npx prisma migrate resolve --applied 20250110000000_init
npx prisma migrate deploy
```

#### Method 2: Reset and Redeploy

```bash
npx prisma migrate reset --force --skip-seed
npx prisma migrate deploy
```

#### Method 3: Force Schema Push

```bash
npx prisma db push --force-reset
npx prisma generate
```

**Prevention:**

- Always test migrations locally first
- Use transaction-safe DDL statements when possible
- Monitor Railway deployment logs for early failure detection

### 2. DATABASE_URL Missing or Invalid

**Error Message:**

```
❌ DATABASE_URL environment variable is missing!
```

**Solutions:**

1. **Add PostgreSQL Service:**
   - Go to Railway project dashboard
   - Add PostgreSQL add-on
   - DATABASE_URL is auto-created

2. **Manual Connection:**
   - Variables tab → New Variable
   - Name: `DATABASE_URL`
   - Value: `${{Postgres.DATABASE_URL}}`

3. **Verify Connection String Format:**
   ```
   postgresql://username:password@host:port/database?schema=public
   ```

### 3. Build Failures

**Common Build Issues:**

#### TypeScript Errors

- **Symptom:** Build fails with TS errors
- **Solution:** Run `pnpm tsc` locally to fix all errors first
- **Prevention:** Enable pre-commit hooks with `pnpm run lint`

#### Missing Dependencies

- **Symptom:** Module not found errors
- **Solution:** Ensure all deps in `package.json`, run `pnpm install`
- **Check:** Verify `pnpm-lock.yaml` is committed

#### Memory Issues

- **Symptom:** Build killed without error message
- **Solution:** Railway has memory limits during build
- **Workaround:** Optimize build process, reduce bundle sizes

### 4. Runtime Startup Failures

#### Port Configuration

```javascript
// WRONG - Fixed port
const PORT = 3000;

// CORRECT - Railway dynamic port
const PORT = process.env.PORT || 8080;
```

#### Health Check Failures

- **Issue:** Railway health checks timeout
- **Solution:** Implement `/health` endpoint
- **Verify:** Endpoint responds quickly (<5 seconds)

#### Environment Variables

**Required for Production:**

```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://your-app.railway.app
NODE_ENV=production
```

### 5. Prisma-Specific Issues

#### Client Generation

**Error:** `@prisma/client` not found
**Solution:**

```bash
npx prisma generate
```

#### Schema Validation

**Error:** Environment variable not found
**Cause:** Missing DATABASE_URL during build
**Solution:** Ensure PostgreSQL service is linked to your app

#### Connection Pool Exhaustion

**Error:** Too many connections
**Solution:** Configure connection pooling:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

### 6. Performance & Resource Issues

#### Bundle Size Warnings

- **Issue:** Large chunks (>1MB)
- **Impact:** Slow cold starts on Railway
- **Solution:** Code splitting, tree shaking, lazy loading

#### Memory Usage

- **Railway Limits:** Varies by plan
- **Monitoring:** Check Railway metrics dashboard
- **Optimization:** Reduce bundle sizes, optimize imports

### 7. Railway Platform-Specific Issues

#### Continuous Retry Loops

- **Behavior:** Railway retries failed deployments automatically
- **Impact:** Resource waste, deployment queue spam
- **Solution:** Fix root cause rather than manual cancellation

#### Domain/SSL Issues

- **Issue:** HTTPS not working
- **Solution:** Verify custom domain configuration in Railway
- **Fallback:** Use Railway-provided domain first

#### Log Access

- **Command:** View real-time logs in Railway dashboard
- **Debugging:** Use structured logging for better visibility
- **Retention:** Railway log retention varies by plan

## Emergency Recovery Procedures

### Complete Database Reset (Last Resort)

```bash
# WARNING: This deletes all data
npx prisma migrate reset --force
npx prisma db seed
```

### Manual Migration Recovery

1. Access Railway PostgreSQL directly
2. Check `_prisma_migrations` table
3. Manually mark failed migration as applied:

```sql
UPDATE "_prisma_migrations"
SET finished_at = NOW()
WHERE migration_name = '20250110000000_init';
```

### Rollback to Previous Deployment

1. Railway dashboard → Deployments tab
2. Find last working deployment
3. Click "Redeploy" on working version

## Monitoring & Prevention

### Pre-Deployment Checklist

- [ ] `pnpm run build` succeeds locally
- [ ] `pnpm run lint` passes
- [ ] All TypeScript errors resolved
- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] Health endpoint responds

### Post-Deployment Verification

- [ ] Application starts without errors
- [ ] Database queries execute successfully
- [ ] Health endpoint accessible
- [ ] Authentication flows work
- [ ] No critical errors in logs

### Health Monitoring

```javascript
// Implement in your app
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});
```

## Getting Help

### Railway Support Channels

- Railway Discord community
- Railway documentation
- GitHub issues for Railway-specific problems

### Project-Specific Support

- Check `CRITICAL_ISSUES_TRACKER.md`
- Review Railway deployment logs
- Verify environment configuration
- Test migrations locally first

---

**Last Updated:** January 2025  
**Railway Plan:** Hobby (adjust limits accordingly)  
**Database:** PostgreSQL with Railway add-on
