# AI Agent Guide: For Troubleshooting Agent

Comprehensive guide for future AI agents troubleshooting Emily Sovereign V4 issues.

## Troubleshooting Philosophy

### Principles
1. **Reproduce the Issue**: Always verify the issue exists
2. **Check Logs First**: Logs are your best friend
3. **Measure Before/After**: Quantify the problem
4. **Test Changes Isolated**: Make one change at a time
5. **Document Everything**: Every troubleshooting step must be logged
6. **Escalate Appropriately**: Know when to ask for help

## Troubleshooting Workflow

### Step 1: Identify Problem
- [ ] Understand user's issue (what's not working?)
- [ ] Identify scope (which component/service affected?)
- [ ] Determine severity (P0-P3: critical to low)
- [ ] Check if issue is reproducible
- [ ] Gather context (when did issue start? what changed?)

### Step 2: Gather Information
- [ ] Check system logs (journalctl)
- [ ] Check application logs (if available)
- [ ] Check service status (systemctl status)
- [ ] Check metrics (Prometheus/Grafana)
- [ ] Check resources (CPU, RAM, disk, network, GPU)
- [ ] Check network connectivity (ping, curl)
- [ ] Check recent changes (git log, CI/CD history)

### Step 3: Isolate Component
- [ ] Identify potential causes (hypotheses)
- [ ] Test each hypothesis independently
- [ ] Eliminate non-issues (process of elimination)
- [ ] Narrow down to root cause
- [ ] Verify isolated issue is reproducible

### Step 4: Implement Fix
- [ ] Design fix (consider alternatives)
- [ ] Test fix in isolated environment
- [ ] Verify fix resolves issue
- [ ] Check for regressions (didn't break other things)
- [ ] Document fix (why did this work?)

### Step 5: Verify Fix
- [ ] Apply fix to production/staging
- [ ] Monitor after fix (logs, metrics)
- [ ] Confirm issue resolved
- [ ] Monitor for side effects
- [ ] Update documentation

## Common Issues & Solutions

### NixOS Issues

#### "Configuration syntax error"
**Symptoms**:
- `nixos-rebuild` fails with syntax error
- Error message points to specific line

**Troubleshooting**:
1. Check line number in error
2. Check for missing quotes/brackets
3. Check for incorrect attribute names
4. Use `nixos-rebuild test` to check syntax
5. Reference NixOS options (search.nixos.org)

**Solution**:
- Fix syntax error
- Rebuild with `nixos-rebuild test`
- Verify with `nixos-rebuild switch`

#### "Build failed"
**Symptoms**:
- `nixos-rebuild` fails during build
- Error mentions derivation failure

**Troubleshooting**:
1. Check internet connection (need to download packages)
2. Check disk space (need space for build)
3. Check Nix channel (correct channel?)
4. Check for conflicting packages

**Solution**:
- Resolve internet/disk issues
- Update NixOS channel: `nix-channel --update`
- Resolve package conflicts

#### "Service won't start"
**Symptoms**:
- `systemctl start service` fails
- Service status: failed/inactive

**Troubleshooting**:
1. Check service logs: `journalctl -u service -f`
2. Check service config: `systemd cat service`
3. Check dependencies: `systemctl list-dependencies service`
4. Check permissions: `ls -la /etc/systemd/system/service.service`

**Solution**:
- Fix configuration errors
- Fix permission issues
- Start dependencies first
- Restart service

### ZFS Issues

#### "Pool degraded"
**Symptoms**:
- `zpool status` shows DEGRADED
- One or more disks offline/failed

**Troubleshooting**:
1. Check which disk failed: `zpool status`
2. Identify disk ID: `ls -la /dev/disk/by-id/`
3. Check if disk physically accessible

**Solution**:
```bash
# Replace failed disk
zpool replace tank /dev/failed-disk /dev/new-disk

# Resilver in progress
zpool status tank | grep resilver

# Wait for resilver to complete
watch -n 10 'zpool status tank | grep resilver'
```

#### "Out of space"
**Symptoms**:
- `zpool list` shows 100% capacity
- Writes fail: "No space left on device"

**Troubleshooting**:
1. Check dataset usage: `zfs list -o space tank`
2. Check snapshot usage: `zfs list -t snapshot -o space`
3. Check for large files: `du -h /tank/data | sort -hr | tail -20`

**Solution**:
```bash
# Delete old snapshots
zfs destroy tank/data@old-snapshot

# Delete old backups
restic forget -r backup: --keep-daily 7 --keep-monthly 3

# Clean up large files
rm /tank/data/large-file
```

#### "Snapshot space growing"
**Symptoms**:
- Snapshot space >50% of dataset
- Rapid snapshot growth

**Troubleshooting**:
1. Check snapshot space: `zfs list -t snapshot -o space`
2. Identify large snapshots
3. Check if snapshots holding onto dataset

**Solution**:
```bash
# Destroy old snapshots
zfs destroy tank/data@hourly-*
zfs destroy tank/data@daily-*

# Adjust snapshot frequency
# Reduce from hourly to every 4 hours
```

### PostgreSQL + pgvector Issues

#### "Connection refused"
**Symptoms**:
- `psql: connection refused`
- `psql: FATAL: remaining connection slots`

**Troubleshooting**:
1. Check if PostgreSQL running: `systemctl status postgresql`
2. Check if port open: `ss -tlnp | grep 5432`
3. Check connection limit: `psql -U postgres -c "SHOW max_connections;"`
4. Check active connections: `psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"`

**Solution**:
```bash
# Start PostgreSQL
systemctl start postgresql

# Increase max connections (edit postgresql.conf)
# max_connections = 200

# Check for idle connections
psql -U postgres -c "SELECT pid, usename, state, count(*) FROM pg_stat_activity GROUP BY state;"
```

#### "Query slow"
**Symptoms**:
- Queries taking >1 second
- pgvector search latency >20ms

**Troubleshooting**:
1. Check query plan: `EXPLAIN ANALYZE <query>`
2. Check if index is being used
3. Check for sequential scans (bad)
4. Check for lock contention

**Solution**:
```sql
-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM memories ORDER BY embedding <=> %s::vector LIMIT 10;

-- If sequential scan, create/update index
CREATE INDEX CONCURRENTLY ON memories
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64, ef = 40);

-- Analyze table for better statistics
ANALYZE memories;
```

#### "HNSW index not used"
**Symptoms**:
- `EXPLAIN ANALYZE` shows Seq Scan
- pgvector query planner ignoring HNSW index

**Troubleshooting**:
1. Check index exists: `\d+ memories`
2. Check index is valid: `REINDEX INDEX CONCURRENTLY memories_embedding_idx`
3. Check PostgreSQL version: `SELECT version();`
4. Check pgvector version: `SELECT * FROM pg_extension();`

**Solution**:
```sql
-- Force PostgreSQL to use HNSW
SET enable_seqscan = off;

-- Or use index hint
SELECT * FROM memories
ORDER BY embedding <=> %s::vector
LIMIT 10;

-- Rebuild index if corrupted
REINDEX INDEX CONCURRENTLY memories_embedding_idx;
```

### SGLang Issues

#### "CUDA out of memory"
**Symptoms**:
- SGLang crash with OOM
- Error: "CUDA out of memory"

**Troubleshooting**:
1. Check GPU memory: `nvidia-smi`
2. Check SGLang config (mem-fraction-static)
3. Check model size (GB vs. VRAM)

**Solution**:
```bash
# Reduce VRAM usage
# Option 1: Reduce batch size
python -m sglang.launch_server --max-running-requests 2

# Option 2: Reduce context length
python -m sglang.launch_server --context-length 2048

# Option 3: Use quantized model (Q4 instead of Q6)
cp /models/llama-7b-q4.gguf /models/llama-7b.gguf
```

#### "Server won't start"
**Symptoms**:
- `systemctl start sglang` fails
- SGLang process exits immediately

**Troubleshooting**:
1. Check SGLang logs: `journalctl -u sglang -f`
2. Check if CUDA available: `nvidia-smi`
3. Check model file: `file /models/llama-7b.gguf`
4. Check if port in use: `ss -tlnp | grep 8000`

**Solution**:
```bash
# Fix model path
ls -la /models/llama-7b.gguf

# Fix CUDA
nvidia-smi

# Fix port conflict
systemctl stop conflicting-service
systemctl start sglang
```

### Network Issues

#### "WireGuard not connecting"
**Symptoms**:
- `wg show` shows "Handshake did not complete"
- Cannot ping WireGuard peer

**Troubleshooting**:
1. Check local IP: `ip addr show`
2. Check peer endpoint: `ping <peer-endpoint>`
3. Check firewall: `iptables -L -n -v | grep 51820`
4. Check WireGuard config: `wg show`

**Solution**:
```bash
# Verify endpoint is correct
ping <peer-ip>

# Verify firewall allows UDP 51820
iptables -A INPUT -p udp --dport 51820 -j ACCEPT

# Restart WireGuard
systemctl restart wg-quick@wg0
```

#### "High latency"
**Symptoms**:
- Ping latency >10ms
- Application slow to respond

**Troubleshooting**:
1. Check network path: `traceroute <destination>`
2. Check packet loss: `ping -c 100 <destination>`
3. Check bandwidth: `iperf3 -c <server>`
4. Check for congestion: `ss -ti | grep tcp_retrans`

**Solution**:
```bash
# Check congestion control
sysctl net.ipv4.tcp_congestion_control

# Verify BBR is active
ss -ti | grep bbr

# Check for packet loss
ping -c 100 <destination>

# Fix network issues
# Contact network admin
# Adjust congestion control settings
```

### Monitoring Issues

#### "Prometheus not scraping"
**Symptoms**:
- Prometheus targets show "down"
- No metrics in Grafana

**Troubleshooting**:
1. Check Prometheus logs: `journalctl -u prometheus -f`
2. Check scrape config: `cat /etc/prometheus/prometheus.yml`
3. Check target accessibility: `curl <target>/metrics`
4. Check network connectivity

**Solution**:
```bash
# Verify target is running
systemctl status <target-service>

# Check if port is open
ss -tlnp | grep <port>

# Check if metrics endpoint exists
curl http://<target>/metrics

# Fix target
# - Start service
# - Fix port/firewall
# - Fix metrics endpoint
```

#### "Alerts not firing"
**Symptoms**:
- Service down but no alert
- Error occurred but no alert

**Troubleshooting**:
1. Check Alertmanager logs: `journalctl -u alertmanager -f`
2. Check alert rules: `cat /etc/alertmanager/alerts.yml`
3. Check if alerts defined for metric
4. Check if alert evaluation is working

**Solution**:
```yaml
# Verify alert rule is defined
groups:
  - name: example
    rules:
      - alert: HighErrorRate
        expr: error_rate > 0.05
        for: 5m

# Check Alertmanager status
curl http://localhost:9093/api/v1/alerts

# Fix alert
# - Fix rule (expr, for duration)
# - Restart Alertmanager
```

## Performance Issues

#### "High CPU usage"
**Symptoms**:
- CPU consistently >90%
- System slow to respond

**Troubleshooting**:
1. Check processes: `top`, `htop`
2. Check CPU usage by process
3. Check for CPU-bound workloads
4. Check if schedulers are overloaded

**Solution**:
```bash
# Identify CPU hog
top -o %CPU | head -20

# If needed, kill/renice process
kill <pid>
renice -n 10 <pid>

# Increase resources (if Ray)
ray up --num-cpus 28
```

#### "High memory usage"
**Symptoms**:
- RAM >90% used
- System starts swapping

**Troubleshooting**:
1. Check memory usage: `free -h`
2. Check processes: `ps aux --sort=-%mem | head -20`
3. Check for memory leaks
4. Check ZFS ARC: `cat /proc/spl/kstat/zfs/arcstats`

**Solution**:
```bash
# Identify memory hog
ps aux --sort=-%mem | head -20

# Reduce ARC if needed
echo "67108864" > /sys/module/zfs/parameters/zfs_arc_max

# Kill/renice process
kill <pid>
renice -n 10 <pid>
```

#### "High GPU usage"
**Symptoms**:
- GPU VRAM >90%
- GPU temperature >85°C

**Troubleshooting**:
1. Check GPU usage: `nvidia-smi`
2. Check which process: `nvidia-smi pmon -c 1`
3. Check GPU temperature
4. Check GPU power usage

**Solution**:
```bash
# Check GPU details
nvidia-smi

# If too hot, reduce load
# - Reduce batch size
# - Reduce concurrent requests

# If OOM, reduce VRAM usage
# - Reduce batch size
# - Reduce context length
# - Use quantized model
```

## Security Issues

#### "Unauthorized access attempt"
**Symptoms**:
- Failed SSH attempts in logs
- Failed authentication in application logs

**Troubleshooting**:
1. Check auth logs: `journalctl -u sshd -f`
2. Check application logs for auth failures
3. Check source IP (geo IP lookup)
4. Determine if automated attack or specific user

**Solution**:
```bash
# Block IP
iptables -A INPUT -s <attacker-ip> -j DROP

# Fail2ban (automatic blocking)
systemctl enable fail2ban

# Strengthen passwords
passwd <user>

# Enable 2FA (if available)
```

#### "Secrets exposed"
**Symptoms**:
- Secrets in git repository
- Secrets in logs
- Secrets in error messages

**Troubleshooting**:
1. Check git history: `git log --all`
2. Check logs for secrets
3. Check error messages
4. Identify which secrets exposed

**Solution**:
```bash
# Remove secrets from git
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch <secret-file>' HEAD

# Encrypt secrets with sops-nix
sops -e --age <recipient> <secret-file>

# Rotate compromised secrets
# Generate new keys
# Update all references
```

## Emergency Procedures

### System Down (P0)
1. **Assess Impact**: Determine user impact
2. **Communicate**: Notify team/users immediately
3. **Check Services**: Check all critical services
4. **Check Logs**: Review error logs
5. **Restart Services**: Restart failed services
6. **Monitor**: Observe after restart
7. **Document**: Record incident and resolution

### Data Loss
1. **Stop Operations**: Prevent further data loss
2. **Check Backups**: Verify latest backup is intact
3. **Assess Loss**: Determine what was lost
4. **Restore**: Restore from backup
5. **Verify**: Verify data integrity
6. **Document**: Record incident and prevention

### Security Breach
1. **Isolate**: Disconnect affected system from network
2. **Preserve Evidence**: Don't reboot/shutdown
3. **Assess Impact**: Determine scope of breach
4. **Contain**: Prevent further access
5. **Remediate**: Remove attacker access
6. **Restore**: Restore from clean backup
7. **Investigate**: Determine root cause
8. **Report**: Report to appropriate authorities
9. **Document**: Record incident and lessons learned

## Troubleshooting Tools

### Log Analysis
```bash
# Real-time log monitoring
journalctl -f

# Filter by service
journalctl -u postgresql -f

# Search for errors
journalctl --grep "ERROR" -f

# Show last 100 lines
journalctl -n 100 -f
```

### System Diagnostics
```bash
# Check system resources
top
htop
free -h
df -h
iostat -x 1

# Check network
ping -c 100 <host>
traceroute <host>
iperf3 -c <server>

# Check GPU
nvidia-smi -l

# Check processes
ps aux
pgrep <process-name>
```

### Application Diagnostics
```bash
# Check PostgreSQL
psql -U postgres -c "SELECT version();"
psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check Ray
ray status

# Check SGLang
curl http://localhost:8000/health

# Check IPFS
ipfs swarm peers
ipfs repo stat
```

## Escalation Criteria

### When to Escalate
- [ ] Issue not resolved after 3 attempts
- [ ] Issue affects critical functionality
- [ ] Issue affects all users
- [ ] Issue involves security breach
- [ ] Issue involves data loss
- [ ] Root cause unclear after investigation
- [ ] Fix requires system downtime >1 hour

### Escalation Process
1. **Document Current State**: What have you tried?
2. **Identify Expert**: Who can help? (Oracle, senior engineer, etc.)
3. **Escalate**: Contact expert with full context
4. **Collaborate**: Work together on resolution
5. **Learn**: Document solution for future reference

---

**Last Updated**: 2026-01-12

**For AI Agents**: When using this guide:
1. Always follow troubleshooting workflow systematically
2. Always gather information before proposing solutions
3. Always measure before/after when applying fixes
4. Always document every troubleshooting step
5. Always test fixes in isolation
6. Always know when to escalate
7. Always learn from incidents
8. Always update documentation after resolution
