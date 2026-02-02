# AI Agent Guide: For Deployment Agent

Comprehensive guide for future AI agents deploying Emily Sovereign V4 components to production.

## Deployment Philosophy

### Principles
1. **Automate Everything**: Manual deployments are error-prone
2. **Test Before Deploy**: Never deploy untested code
3. **Monitor Continuously**: Observe deployment in real-time
4. **Rollback Gracefully**: Always have rollback plan ready
5. **Document Everything**: Every deployment must be logged

### Deployment Environments
- **Development**: Local development (changes frequently)
- **Staging**: Pre-production (testing before production)
- **Production**: Live environment (users access)
- **Canary**: Subset of users (gradual rollout)

## Pre-Deployment Checklist

### Code Readiness
- [ ] Code reviewed and approved
- [ ] All tests passing (>90% pass rate)
- [ ] Diagnostics clean (lsp_diagnostics)
- [ ] Code coverage measured (>80%)
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)

### Environment Readiness
- [ ] Configuration files reviewed (environment variables)
- [ ] Secrets prepared (encrypted with sops-nix)
- [ ] Dependencies updated (NixOS packages, Python packages)
- [ ] Database migrations prepared (if needed)
- [ ] Backup plan ready (snapshot before deployment)
- [ ] Rollback plan ready (previous version available)
- [ ] Monitoring dashboards ready (alerts configured)
- [ ] Team notified (deployment schedule communicated)

### Infrastructure Readiness
- [ ] Sufficient resources available (CPU, RAM, disk, GPU)
- [ ] Network bandwidth verified (for deployments)
- [ ] Storage available (disk space for backups)
- [ ] Backup storage verified (offsite backup accessible)
- [ ] Load balancer ready (if blue-green/canary)
- [ ] CI/CD pipeline ready (Forgejo Actions)

## Deployment Strategies

### Blue-Green Deployment

#### When to Use
- **Critical services** (zero downtime unacceptable)
- **Services with complex state** (hard to rollback in-place)
- **Services with user impact** (user-facing applications)

#### Deployment Steps
1. **Deploy Green**: Deploy new version to green environment
2. **Test Green**: Verify green environment is healthy
3. **Switch Traffic**: Update load balancer to route traffic to green
4. **Monitor Green**: Observe green environment for issues
5. **Rollback (if needed)**: Switch traffic back to blue

#### Blue-Green Checklist
- [ ] Blue environment running (current version)
- [ ] Green environment ready (new version)
- [ ] Load balancer configured (traffic routing)
- [ ] Health checks configured (blue and green)
- [ ] Metrics comparison (blue vs. green)
- [ ] Rollback procedure documented
- [ ] Rollback tested (switch back to blue)
- [ ] Traffic switch tested (manual and automatic)

### Canary Deployment

#### When to Use
- **API endpoints** (easy to measure success/failure)
- **Services with fast iteration** (frequent updates)
- **Services where partial failures acceptable** (10% users can see new version)

#### Deployment Steps
1. **Deploy Canary**: Deploy new version to canary subset
2. **Route Traffic**: Direct 10-50% traffic to canary
3. **Monitor Metrics**: Observe error rate, latency, user feedback
4. **Evaluate Results**: Compare canary vs. production metrics
5. **Rollout** (if successful): Increase traffic to 100%
6. **Rollback** (if failed): Reduce canary traffic to 0%

#### Canary Checklist
- [ ] Canary infrastructure configured
- [ ] Canary traffic routing configured (percentage-based)
- [ ] Canary metrics monitored (error rate, latency)
- [ ] Success criteria defined (<5% error rate)
- [ ] Failure criteria defined (error rate >10%)
- [ ] Automatic rollback configured (on failure)
- [ ] Canary duration configured (ramp-up period)
- [ ] Canary deployment tested
- [ ] Canary rollback tested

### Rolling Deployment

#### When to Use
- **Stateless services** (no complex state to manage)
- **Services with multiple instances** (deploy instance by instance)
- **Services with horizontal scaling** (can handle partial rollout)

#### Deployment Steps
1. **Deploy Instance 1**: Deploy to first instance
2. **Verify Instance 1**: Health check passing
3. **Deploy Instance 2**: Deploy to second instance
4. **Verify Instance 2**: Health check passing
5. **Continue**: Deploy remaining instances one-by-one
6. **Monitor**: Observe overall system health

#### Rolling Deployment Checklist
- [ ] Instances identified (deployment order)
- [ ] Health check endpoints defined
- [ ] Monitoring configured (per-instance metrics)
- [ ] Rollback plan ready (revert individual instances)
- [ ] Deployment tested (small scale)
- [ ] Full deployment tested (full scale)

## Specific Component Deployment

### NixOS System Updates
1. **Update NixOS**: `nix-channel --update`
2. **Test Rebuild**: `nixos-rebuild test` (verify configuration)
3. **Full Rebuild**: `nixos-rebuild switch` (apply changes)
4. **Reboot System**: Reboot to apply kernel changes
5. **Verify Services**: Check all services started correctly

### PostgreSQL Schema Changes
1. **Backup Database**: Create ZFS snapshot before migration
2. **Run Migration**: Apply schema changes (ALTER TABLE, etc.)
3. **Verify Migration**: Check data integrity, query performance
4. **Update Application**: Deploy application compatible with new schema
5. **Monitor Errors**: Check logs for migration errors
6. **Rollback Plan**: Keep snapshot for 7 days

### SGLang Model Updates
1. **Stop Server**: Graceful shutdown of SGLang
2. **Replace Model**: Copy new model to /models/ directory
3. **Update Config**: Update model path in configuration
4. **Start Server**: Start SGLang with new model
5. **Verify Loading**: Check model loaded successfully
6. **Test Inference**: Verify model works correctly
7. **Monitor VRAM**: Check GPU memory usage

### pgvector Index Changes
1. **Backup Database**: Create ZFS snapshot
2. **Drop Old Index**: `DROP INDEX CONCURRENTLY`
3. **Create New Index**: `CREATE INDEX CONCURRENTLY` (with HNSW)
4. **Verify Performance**: Compare query performance
5. **Update Application**: Deploy if needed
6. **Monitor**: Check index size, query time

### IPFS Content Updates
1. **Add New Content**: `ipfs add` for new data
2. **Pin Critical Content**: `ipfs pin add` for important CIDs
3. **Update References**: Update pgvector with new CIDs
4. **Verify Retrieval**: Test IPFS get for new CIDs
5. **Monitor**: Check IPFS storage, replication

### Ray Cluster Updates
1. **Drain Node**: `ray drain <node-id>` (remove from cluster)
2. **Update Code**: Deploy new code to node
3. **Restart Node**: `ray start` (rejoin cluster)
4. **Verify Cluster**: Check cluster status with `ray status`
5. **Monitor**: Check cluster metrics (actors, tasks)
6. **Scale Up**: Add new nodes if needed

## CI/CD Integration

### Forgejo Actions Deployment
```yaml
# Automated deployment via Forgejo Actions
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - name: Deploy
        run: |
          # Backup before deployment
          nix-shell -p phase0_nixos_setup/scripts/backup.sh

          # Deploy application
          nix-env switch --upgrade --profile production

          # Health check
          curl -f http://localhost:8000/health || exit 1

      - name: Rollback on failure
        if: failure()
        run: |
          nix-env switch --rollback
```

### Prefect Flow Deployment
```python
# Deploy Prefect flow
from prefect import flow, deploy

@flow
def deploy_application():
    # Deployment logic
    pass

# Deploy to Prefect Cloud
deploy_application.deploy(
    name="deploy-flow",
    schedule_interval=None,  # Manual trigger
)

# Trigger via API
import requests
response = requests.post(
    'http://localhost:4200/api/flows/deploy_application/run',
    json={'parameters': {}}
)
```

### Temporal Workflow Deployment
```bash
# Deploy Temporal workflow
tctl workflow start \
  --task-queue sovereign \
  --input '{"deployment": "production"}' \
  deploy_workflow
```

## Monitoring Deployment

### Pre-Deployment Metrics
- [ ] Record baseline metrics (CPU, RAM, disk, network, GPU)
- [ ] Record baseline error rates
- [ ] Record baseline performance (latency, throughput)
- [ ] Record baseline user metrics (if available)

### During Deployment
- [ ] Monitor logs in real-time (journalctl -f)
- [ ] Monitor metrics dashboards (Grafana)
- [ ] Monitor alerts (Prometheus Alertmanager)
- [ ] Health check endpoints (every 30 seconds)
- [ ] User feedback (if available)

### Post-Deployment Metrics
- [ ] Compare to baseline (better/worse/same)
- [ ] Verify no errors in logs
- [ ] Verify no alerts triggered
- [ ] Verify all services healthy
- [ ] Verify performance targets met
- [ ] Verify user metrics improved (or unchanged)

## Rollback Procedures

### Immediate Rollback (<5 minutes)
1. **Identify Issue**: Confirm deployment is causing problem
2. **Stop Rollout**: Halt further deployments
3. **Execute Rollback**: Run rollback command
4. **Verify Fix**: Verify issue is resolved
5. **Monitor**: Check metrics for stability
6. **Document**: Document rollback reason

### Delayed Rollback (<1 hour)
1. **Assess Impact**: Evaluate user impact
2. **Plan Rollback**: Determine rollback strategy
3. **Notify Users**: Communicate planned rollback
4. **Execute Rollback**: Perform rollback
5. **Verify Fix**: Confirm issue resolved
6. **Monitor**: Check for new issues
7. **Document**: Document incident and resolution

### Rollback Strategies

#### NixOS Rollback
```bash
# Rollback NixOS configuration
nixos-rebuild switch --rollback

# Verify previous generation loaded
nixos-version
```

#### PostgreSQL Rollback
```bash
# Restore from ZFS snapshot
zfs rollback tank/data@pre-migration

# Verify data integrity
psql -U postgres -d sovereign -c "SELECT COUNT(*) FROM memories;"
```

#### SGLang Rollback
```bash
# Revert to previous model
systemctl stop sglang
cp /models/llama-7b-old.gguf /models/llama-7b.gguf
systemctl start sglang

# Verify model loaded
curl http://localhost:8000/health
```

#### Blue-Green Rollback
```bash
# Switch traffic back to blue
# Via load balancer API
curl -X POST http://load-balancer/switch \
  -H "Content-Type: application/json" \
  -d '{"environment": "blue"}'
```

#### Canary Rollback
```bash
# Set canary traffic to 0%
curl -X POST http://load-balancer/canary \
  -H "Content-Type: application/json" \
  -d '{"percentage": 0}'
```

## Incident Management

### During Deployment Incident
1. **Identify Issue**: Determine scope and severity
2. **Communicate**: Notify team immediately
3. **Assess Impact**: Determine user impact
4. **Mitigate**: Execute rollback or hotfix
5. **Monitor**: Verify fix is working
6. **Resolve**: Confirm issue fully resolved
7. **Post-Mortem**: Document root cause and prevention

### Severity Levels
- **P0**: Critical (system down, all users affected) - Immediate action
- **P1**: High (major feature broken, >50% users affected) - Action within 1 hour
- **P2**: Medium (minor feature broken, <50% users affected) - Action within 4 hours
- **P3**: Low (minor issue, <10% users affected) - Action within 24 hours

## Deployment Checklist (Final)

### Before Deployment
- [ ] All pre-deployment items complete
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring dashboards ready
- [ ] Backup created (ZFS snapshot + Restic)
- [ ] Health check endpoints defined

### During Deployment
- [ ] Deployment started (timestamp logged)
- [ ] Deployment steps documented
- [ ] Logs monitored in real-time
- [ ] Metrics monitored continuously
- [ ] Health checks executed regularly
- [ ] Any issues immediately addressed

### After Deployment
- [ ] Deployment completed (timestamp logged)
- [ ] Health checks passing
- [ ] Metrics within targets
- [ ] No errors in logs
- [ ] No alerts triggered
- [ ] User feedback positive (or neutral)
- [ ] Rollback plan archived (not needed)
- [ ] Post-deployment documentation created

---

**Last Updated**: 2026-01-12

**For AI Agents**: When using this guide:
1. Always have rollback plan before deploying
2. Always test thoroughly before production
3. Always monitor continuously during deployment
4. Always have health checks ready
5. Always document every deployment
6. Always communicate with team before deploying
7. Always verify deployment success before marking complete
8. Always monitor for at least 24 hours post-deployment
