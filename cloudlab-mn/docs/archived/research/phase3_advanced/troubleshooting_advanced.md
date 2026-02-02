# Advanced Troubleshooting Guide

**Component**: Phase 3 - All Modules
**Architecture**: Emily Sovereign V4 Triune
**Date**: 2026-01-12
**Status**: Reference Guide

---

## Table of Contents

1. [IPFS Issues](#1-ipfs-issues)
2. [Monitoring Issues](#2-monitoring-issues)
3. [Workflow Issues](#3-workflow-issues)
4. [Backup Issues](#4-backup-issues)
5. [Security Issues](#5-security-issues)
6. [Deployment Issues](#6-deployment-issues)

---

## 1. IPFS Issues

### 1.1 IPFS Daemon Won't Start

**Symptoms**:
- Systemctl shows ipfs service failed
- No process listening on port 4001
- Cannot connect to API on port 5001

**Diagnosis**:
```bash
# Check service status
sudo systemctl status ipfs

# Check logs
sudo journalctl -u ipfs -n 100

# Check port availability
sudo netstat -tlnp | grep -E "(4001|5001)"

# Check IPFS configuration
sudo -u ipfs ipfs config show
```

**Solutions**:

1. **Permission Issues**:
```bash
# Fix ownership
sudo chown -R ipfs:ipfs /mnt/zpool/ipfs
sudo chmod -R 755 /mnt/zpool/ipfs
```

2. **Port Conflicts**:
```bash
# Find conflicting process
sudo lsof -i :4001
sudo lsof -i :5001

# Kill conflicting process or change IPFS ports
sudo -u ipfs ipfs config --json Addresses.API "/ip4/127.0.0.1/tcp/5002"
sudo systemctl restart ipfs
```

3. **Configuration Errors**:
```bash
# Reset to default configuration
sudo -u ipfs ipfs config profile apply server
sudo systemctl restart ipfs
```

### 1.2 No Peers Connected

**Symptoms**:
- ipfs swarm peers returns empty list
- Content cannot be retrieved from IPFS
- High latency for IPFS operations

**Diagnosis**:
```bash
# Check peer count
ipfs swarm peers

# Check bootstrap nodes
ipfs bootstrap list

# Check network connectivity
ping ipfs.io
curl -I https://ipfs.io

# Check firewall
sudo nft list chain inet filter input | grep 4001
```

**Solutions**:

1. **Add Bootstrap Nodes**:
```bash
# Add public bootstrap nodes
ipfs bootstrap add /ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2GKnkn4J8LysWqLJ7G2yYxz4qYzN3v5iZj
ipfs bootstrap add /dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbAU5mFinwYgRQ
```

2. **Fix Firewall Rules**:
```bash
# Open IPFS ports
sudo nft add rule inet filter input tcp dport 4001 accept
sudo nft add rule inet filter input udp dport 4001 accept

# Allow established connections
sudo nft add rule inet filter input ct state established accept
```

3. **Disable MDNS for Private Networks**:
```bash
# Disable mDNS
sudo -u ipfs ipfs config --json Discovery.MDNS.Enabled false
sudo systemctl restart ipfs
```

### 1.3 High Bandwidth Usage

**Symptoms**:
- Network bill higher than expected
- Slow response times due to bandwidth saturation
- Monitoring shows high outbound traffic from IPFS

**Diagnosis**:
```bash
# Check IPFS bandwidth
ipfs swarm bandwidth

# Check connection count
ipfs swarm peers | wc -l

# Check current limits
ipfs config Swarm.ConnMgr
```

**Solutions**:

1. **Reduce Connection Limits**:
```bash
# Lower connection limits
sudo -u ipfs ipfs config --json Swarm.ConnMgr.LowWater 20
sudo -u ipfs ipfs config --json Swarm.ConnMgr.HighWater 40
sudo systemctl restart ipfs
```

2. **Enable Traffic Shaping**:
```bash
# Create traffic shaping rules
sudo tc qdisc add dev eth0 root handle 1: htb rate 100mbit
sudo tc class add dev eth0 parent 1: classid 1:20 htb rate 50mbit
sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 4001 0xffff flowid 1:20
```

3. **Limit Gateway Bandwidth**:
```bash
# Set gateway upload limit
sudo -u ipfs ipfs config --json Gateway.MaxUploadSize 53687091200  # 50GB
```

### 1.4 Storage Exhaustion

**Symptoms**:
- IPFS daemon stops responding
- Cannot add new files to IPFS
- ZFS dataset is full

**Diagnosis**:
```bash
# Check IPFS repo size
ipfs repo stat

# Check ZFS usage
zfs list -o name,used,avail zpool/ipfs

# Check storage limits
ipfs config Datastore
```

**Solutions**:

1. **Run Garbage Collection**:
```bash
# Run GC
sudo -u ipfs ipfs repo gc

# Enable periodic GC
sudo -u ipfs ipfs config --json Datastore.GCPeriod "1h"
```

2. **Increase Storage Limits**:
```bash
# Increase storage quota (if you have more space)
sudo -u ipfs ipfs config --json Datastore.StorageMax "4TB"
```

3. **Unpin Unnecessary Content**:
```bash
# List pinned content
ipfs pin ls --type=recursive

# Unpin old content
ipfs pin rm Qm...  # CID of old content
ipfs repo gc
```

---

## 2. Monitoring Issues

### 2.1 DeepFlow Not Collecting Traces

**Symptoms**:
- No traces visible in DeepFlow UI
- Zero traces in Grafana dashboard
- DeepFlow logs show errors

**Diagnosis**:
```bash
# Check DeepFlow status
sudo docker ps | grep deepflow
sudo docker logs deepflow-server

# Check eBPF access
ls -la /sys/kernel/debug/tracing

# Check kernel support
cat /proc/sys/kernel/unprivileged_bpf_disabled
```

**Solutions**:

1. **Fix eBPF Permissions**:
```bash
# Enable eBPF
sudo sysctl kernel.unprivileged_bpf_disabled=0

# Run DeepFlow with elevated privileges
sudo docker run -d \
  --name deepflow-server \
  --network=host \
  --privileged \
  --cap-add=SYS_ADMIN \
  -v /sys/kernel/debug:/sys/kernel/debug:ro \
  deepflowio/deepflow:latest
```

2. **Check Kernel Version**:
```bash
# Check kernel version (4.9+ required)
uname -r

# Update kernel if needed
sudo nix-channel --update https://nixos.org/channels/nixos-23.11
sudo nixos-rebuild switch --upgrade
```

### 2.2 Pyroscope Profiling Not Working

**Symptoms**:
- No profiles visible in Pyroscope UI
- Application crashes when Pyroscope enabled
- High overhead when profiling

**Diagnosis**:
```bash
# Check Pyroscope status
sudo docker ps | grep pyroscope
sudo docker logs pyroscope-server

# Check application logs
# Look for Pyroscope connection errors
```

**Solutions**:

1. **Check Pyroscope Server Address**:
```python
# Verify server address
from pyroscope import PyroscopeClient

pyroscope_client = PyroscopeClient(
    server_address="http://localhost:4040",  # Correct address
    service_name="emily-sovereign",
)
```

2. **Reduce Sampling Rate**:
```python
# Reduce sampling frequency
pyroscope_client = PyroscopeClient(
    server_address="http://localhost:4040",
    service_name="emily-sovereign",
    sampling_rate=10,  # Sample 10% of the time
)
```

3. **Filter Specific Packages**:
```python
# Only profile specific packages
pyroscope_client = PyroscopeClient(
    server_address="http://localhost:4040",
    service_name="emily-sovereign",
    tags={"profile": "memory-consolidation"},
)
```

---

## 3. Workflow Issues

### 3.1 Prefect Flow Stuck in Running State

**Symptoms**:
- Flow shows as "Running" but no progress
- Tasks not executing
- High memory usage by Prefect worker

**Diagnosis**:
```bash
# Check Prefect UI
# Navigate to flow page and check task states

# Check Prefect worker logs
sudo docker logs prefect-worker

# Check for deadlocks
# Look for "waiting on task" in logs
```

**Solutions**:

1. **Cancel and Restart Flow**:
```python
from prefect import get_client

async with get_client() as client:
    # Cancel stuck flow
    await client.cancel_flow_run(flow_run_id="flow-run-id")
    
    # Restart flow
    await client.create_flow_run(
        flow_name="memory-consolidation-pipeline",
        parameters={"consolidation_window_hours": 24}
    )
```

2. **Increase Worker Resources**:
```yaml
# docker-compose-prefect-worker.yml
services:
  prefect-worker:
    image: prefect/prefect:latest
    command: prefect worker start --pool emily-pool
    environment:
      - PREFECT_API_URL=http://localhost:4200/api
      - PREFECT_WORKER_QUERY_SECONDS=10
      - PREFECT_WORKER_PREFETCH_SECONDS=30
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
```

### 3.2 Temporal Workflow Not Persisting

**Symptoms**:
- Workflow state lost after server restart
- Cannot resume long-running workflows
- Data corruption in workflow state

**Diagnosis**:
```bash
# Check Temporal status
sudo docker ps | grep temporal
sudo docker logs temporal

# Check PostgreSQL connection
docker exec temporal-postgres psql -U temporal -d temporal -c "\dt"

# Check Tempo
