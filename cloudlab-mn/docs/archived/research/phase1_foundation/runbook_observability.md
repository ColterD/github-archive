# Runbook: Observability Stack Operations

**Purpose**: Day-to-day operations for Cilium, Hubble, Langfuse

---

## Daily Checks

### Morning Health Check (5 min)

```bash
# 1. Check Cilium
cilium status | grep "Cilium:"

# 2. Check Hubble
cilium hubble status | grep "Flow Recording:"

# 3. Check Langfuse
curl -s http://langfuse.cloudlab.internal/health

# 4. Check eBPF flows
cilium hubble observe --since 1h | wc -l
```

### Flow Analysis (10 min)

```bash
# Top 5 flow sources
cilium hubble observe --last 5m | awk '{print $5}' | sort | uniq -c | sort -rn | head -5

# Anomalous flows (>1GB transferred)
cilium hubble observe --last 1h | awk '$7 > 1000000000'
```

---

## Weekly Maintenance

### Sunday: Log Rotation (15 min)

```bash
# Rotate Langfuse logs
docker logs langfuse --tail 10000 > /backup/langfuse.log.$(date +%Y%m%d)
docker logs langfuse-postgres --tail 10000 > /backup/postgres.log.$(date +%Y%m%d)

# Clear old Cilium flows
cilium hubble flows clear --before 7d
```

---

## Incident Response

### High Network Latency

```bash
# Check Cilium datapath
cilium status | grep "Datapath Mode"

# If "vtep", disable tunneling
cilium config disable-tunnel
```

### Langfuse Tracing Gaps

```bash
# Check Langfuse receiver
docker logs langfuse | grep "trace"

# Verify OTLP endpoint connectivity
curl -v http://langfuse.cloudlab.internal:4318/health
```

---

