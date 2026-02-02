#!/bin/bash
# reference_master/code_examples/shell_examples.sh
# Complete collection of shell script examples for Emily Sovereign V4 automation and operations.

## Phase 0: NixOS Setup

### NixOS Rebuild
# phase0_nixos_setup/scripts/rebuild.sh
echo "Testing configuration..."
nixos-rebuild test

# If successful, rebuild and switch
if [ $? -eq 0 ]; then
    echo "Configuration valid, rebuilding..."
    nixos-rebuild switch
    echo "Rebuild successful!"
else
    echo "Configuration error, check syntax"
    exit 1
fi

### ZFS Backup Script
# phase0_nixos_setup/scripts/zfs_snapshot.sh
# Hourly snapshots (keep 24)
echo "Creating hourly snapshot..."
zfs snapshot tank/data@hourly-$(date +%Y%m%d-%H)

# Daily snapshots (keep 30)
echo "Creating daily snapshot..."
zfs snapshot tank/data@daily-$(date +%Y%m%d)

# Monthly snapshots (keep 12)
echo "Creating monthly snapshot..."
zfs snapshot tank/data@monthly-$(date +%Y-%m)

# Prune old snapshots
echo "Pruning old hourly snapshots..."
zfs list -t snapshot -o name,creation | \
  grep "hourly-" | tail -n +25 | \
  xargs -I {} zfs destroy {}

echo "Pruning old daily snapshots..."
zfs list -t snapshot -o name,creation | \
  grep "daily-" | tail -n +31 | \
  xargs -I {} zfs destroy {}

### WireGuard Status Check
# phase0_nixos_setup/scripts/check_wireguard.sh
# Check WireGuard status
echo "WireGuard Status:"
wg show

# Check if connected
if wg show | grep -q "interface: wg0"; then
    echo "✓ WireGuard interface active"
else
    echo "✗ WireGuard interface not active"
fi

# Check peer connection
if wg show | grep -q "peer:"; then
    echo "✓ Peer configured"
else
    echo "✗ No peer configured"
fi

# Check latest handshake
LATEST_HANDSHAKE=$(wg show | grep "latest handshake" | awk '{print $3}')
echo "Latest handshake: $LATEST_HANDSHAKE"

# If handshake >5 minutes ago, warn
HANDSHAKE_AGO=$(($(date +%s) - $(date -d "$LATEST_HANDSHAKE" +%s)))
if [ $HANDSHAKE_AGO -gt 300 ]; then
    echo "⚠ Warning: Handshake was more than 5 minutes ago"
fi

## Phase 1: ML Infrastructure

### SGLang Start Script
# phase1_foundation/scripts/start_sglang.sh
# Set CUDA device
export CUDA_VISIBLE_DEVICES=0

# Start SGLang server with optimal Tesla P4 configuration
python -m sglang.launch_server \
  --model-path /models/llama-7b-q4.gguf \
  --port 8000 \
  --host 0.0.0.0 \
  --tp 1 \
  --pp 1 \
  --mem-fraction-static 0.9 \
  --max-running-requests 4 \
  --schedule-policy fcfs \
  --dtype float16 \
  --context-length 4096 \
  --cache-max-entry-count 8192 \
  --cache-max-byte-size 67108864 \
  --chunked-context

echo "SGLang started on port 8000"
echo "Configuration: 7B Q4, batch=4, context=4096, VRAM=7.2GB"

# Health check
sleep 5
curl -f http://localhost:8000/health || echo "SGLang health check failed"

### MLflow Tracking Script
# phase1_foundation/scripts/mlflow_tracking.py
#!/usr/bin/env python3

import mlflow
import sys

# Start MLflow tracking server
mlflow.set_tracking_uri("http://localhost:5000")

# Start a new experiment
with mlflow.start_run():
    # Log parameters
    mlflow.log_param("learning_rate", 0.001)
    mlflow.log_param("batch_size", 4)
    mlflow.log_param("epochs", 10)

    # Train model (example)
    # ... training code ...
    accuracy = 0.95

    # Log metrics
    mlflow.log_metric("accuracy", accuracy)
    mlflow.log_metric("loss", 0.05)

    # Log model artifact
    mlflow.log_artifact("/models/model.pkl", "model")

    print("Training completed and logged to MLflow")

### DVC Pipeline Script
# phase1_foundation/scripts/dvc_pipeline.sh
# Initialize DVC
dvc init

# Track large files
dvc add models/llama-7b.gguf
dvc add data/training_data.csv

# Commit to Git
git add models/.gitignore data/.gitignore .dvc/config
git commit -m "Add DVC tracked files"

# Push to remote
dvc push

### Feast Feature Store Script
# phase1_foundation/scripts/feast_apply.sh
# Apply feature definitions
feast apply feature_store.yaml

# Materialize features
echo "Materializing features..."
feast materialize 2026-01-01

# Load features to Redis online store
echo "Loading features to online store..."
python load_features_to_redis.py

echo "Feast features loaded and materialized"

## Phase 2: Edge & Performance

### WasmEdge Build Script
# phase2_edge_performance/scripts/build_wasm_module.sh
# Compile Python to WASM
python -m wasm_edge.bindgen \
  -p . \
  -o cognitive_module.wasm \
  -s cognitive_module.py

# Verify WASM module
file cognitive_module.wasm

echo "Wasm module compiled: cognitive_module.wasm"

### WasmEdge Start Script
# phase2_edge_performance/scripts/start_wasmedge.sh
# Start WasmEdge with Python runtime
wasmedge \
  --dir /opt/wasm \
  --address 0.0.0.0 \
  --port 8080 \
  --thread-num 4 \
  --max-memory-pages 4096 \
  --log-level info

echo "WasmEdge started on port 8080"

### Ray Cluster Start Script
# phase2_edge_performance/scripts/start_ray_cluster.sh
# Start Ray head node
ray start --head \
  --port=6379 \
  --redis-max-memory=4000000000

# Start Ray worker nodes
ray start \
  --address="10.0.1.10:6379" \
  --num-cpus=8 \
  --resources='{"CPU": 8}'

echo "Ray cluster started"
echo "Head node: 10.0.1.10:6379"
echo "Workers: 2"

## Phase 3: Advanced Features

### IPFS Add Content Script
# phase3_advanced/scripts/ipfs_add.sh
CONTENT_PATH=$1

# Add content to IPFS
echo "Adding $CONTENT_PATH to IPFS..."
CID=$(ipfs add -r $CONTENT_PATH | awk '{print $2}')

echo "Content added with CID: $CID"

# Pin important content
echo "Pinning CID..."
ipfs pin add $CID

echo "Content pinned successfully"
echo "CID: $CID"

### IPFS Retrieve Content Script
# phase3_advanced/scripts/ipfs_get.sh
CID=$1
OUTPUT_PATH=$2

# Retrieve content from IPFS
echo "Retrieving CID: $CID..."
ipfs get $CID -o $OUTPUT_PATH

echo "Content retrieved: $OUTPUT_PATH"

# Verify file
if [ -f $OUTPUT_PATH ]; then
    echo "✓ File retrieved successfully"
else
    echo "✗ File retrieval failed"
fi

### Restic Backup Script
# phase3_advanced/scripts/restic_backup.sh
# Backup data
echo "Starting Restic backup..."
restic -r s3:s3.amazonaws.com/sovereign-backup \
  --password-file /root/.restic-password \
  backup /tank/data

# Forget old backups
echo "Pruning old backups..."
restic forget -r s3:s3.amazonaws.com/sovereign-backup \
  --password-file /root/.restic-password \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 6

# Prune repository
echo "Pruning repository..."
restic prune -r s3:s3.amazonaws.com/sovereign-backup \
  --password-file /root/.restic-password

echo "Backup completed"

### Restic Restore Test Script
# phase3_advanced/scripts/restic_restore_test.sh
# Restore to temporary location
echo "Testing restore..."
restic -r s3:s3.amazonaws.com/sovereign-backup \
  --password-file /root/.restic-password \
  restore latest \
  --target /tmp/restore-test

# Verify restore
if [ -f /tmp/restore-test/important_file ]; then
    echo "✓ Restore test successful"
    diff /tank/data/important_file /tmp/restore-test/important_file
    if [ $? -eq 0 ]; then
        echo "✓ File integrity verified"
    else
        echo "✗ File integrity check failed"
    fi
    rm -rf /tmp/restore-test
else
    echo "✗ Restore test failed"
fi

### Prefect Flow Deploy Script
# phase3_advanced/scripts/prefect_deploy.sh
# Deploy Prefect flow
echo "Deploying Prefect flow..."
prefect deploy \
  --name cognitive-module-flow \
  --pool sovereign-pool \
  --worker-queue sovereign-queue \
  --interval 3600 \
  flows.py

echo "Prefect flow deployed"
echo "Check dashboard: http://localhost:4200"

## Monitoring

### Prometheus Health Check Script
# scripts/check_prometheus.sh
# Check Prometheus status
echo "Checking Prometheus health..."
curl -f http://localhost:9090/-/healthy

# Check if scraping targets
echo "Active scrape targets:"
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {target, health}'

# Check for errors
echo "Checking for errors..."
curl -s http://localhost:9090/api/v1/query | jq '.data.result[] | select(.metric | contains("error"))'

### Grafana Dashboard Export Script
# scripts/export_grafana_dashboards.sh
# Export all Grafana dashboards
echo "Exporting Grafana dashboards..."
curl -u admin:password \
  http://localhost:3000/api/search?query=dash \
  -o grafana_dashboards.json

echo "Dashboards exported to: grafana_dashboards.json"

## Utilities

### System Health Check Script
# scripts/system_health.sh
echo "=== Sovereign System Health Check ==="
echo ""

# CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
echo "CPU Usage: $CPU_USAGE%"

# Memory usage
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
echo "Memory Usage: $MEM_USAGE%"

# Disk usage
DISK_USAGE=$(df -h /tank | awk 'NR==2 {print $5}')
echo "Disk Usage: $DISK_USAGE"

# GPU usage
if nvidia-smi &> /dev/null; then
    GPU_USAGE=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits)
    echo "GPU Usage: $GPU_USAGE%"
else
    echo "GPU: Not available"
fi

# Network connectivity
PING_RESULT=$(ping -c 1 8.8.8.8 | tail -1 | awk '{print $4}')
echo "Network: $PING_RESULT"

# Critical services
echo ""
echo "Critical Services:"
systemctl status postgresql | grep "Active:" || echo "  ✗ PostgreSQL"
systemctl status sglang | grep "Active:" || echo "  ✗ SGLang"
systemctl status redis | grep "Active:" || echo "  ✗ Redis"
systemctl status ray-head | grep "Active:" || echo "  ✗ Ray"

echo ""
echo "=== Health Check Complete ==="
