# Backup and Disaster Recovery Guide

**Component**: Phase 3 - Backup & Disaster Recovery
**Architecture**: Emily Sovereign V4 Triune
**Date**: 2026-01-12
**Status**: Implementation Guide

---

## 1. Overview

### 1.1 Backup Strategy

The 3-2-1 Backup Rule:
- **3** copies of data: Production, ZFS snapshot, Restic offsite
- **2** different media: Local ZFS, Cloud (S3)
- **1** offsite: S3-compatible storage (MinIO, Wasabi, Backblaze B2)

### 1.2 RTO/RPO Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| RTO (Recovery Time Objective) | <15 minutes | Time to restore from backup |
| RPO (Recovery Point Objective) | <5 minutes | Maximum data loss |

---

## 2. ZFS Snapshot Configuration

### 2.1 Automated Snapshots

```bash
# /usr/local/bin/zfs_snapshot.sh
#!/bin/bash
# Automated ZFS snapshots with retention policies

# Hourly snapshots (24-hour retention)
for dataset in zpool/data zpool/emily; do
    zfs snapshot $dataset@hourly-$(date +%Y%m%d-%H%M%S)
done

# Clean up old snapshots (keep 24 hourly)
for dataset in zpool/data zpool/emily; do
    zfs list -t snapshot -o name -H $dataset | \
        grep "@hourly-" | \
        head -n -24 | \
        while read snapshot; do
            zfs destroy "$snapshot"
        done
done
```

### 2.2 Pre-Backup Snapshot

```bash
# Create snapshot before Restic backup
SNAPSHOT_NAME="backup-$(date +%Y%m%d-%H%M%S)"
zfs snapshot zpool/data/emily@$SNAPSHOT_NAME

# Run Restic backup
restic backup /mnt/zpool/emily --repo s3:emily-backups/restic

# Clean up snapshot (keep for 1 hour)
zfs destroy zpool/data/emily@$SNAPSHOT_NAME
```

---

## 3. Restic Backup Configuration

### 3.1 Setup Restic

```bash
# Initialize Restic repository
export RESTIC_REPOSITORY="s3:https://s3.wasabisys.com/emily-backups"
export RESTIC_PASSWORD_FILE="/etc/restic/password"
restic init

# Configure backup exclusions
cat > /etc/restic/excludes.txt << 'EOF'
*.tmp
*.log
*.swp
.ipfs/
cache/
tmp/
