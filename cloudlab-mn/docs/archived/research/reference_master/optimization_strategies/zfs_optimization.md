# ZFS Optimization Strategies

Comprehensive guide to optimizing ZFS for the Emily Sovereign V4 project on CloudLab c220g5.

## Hardware Context

### CloudLab c220g5 Storage
- **14x 12TB HDDs** (168TB raw)
- **RAIDZ2 Configuration** (2 parity)
- **Usable Capacity**: ~144TB (after RAIDZ2)
- **Expected Usage**: 50-100TB active data

## ZFS Architecture Design

### RAIDZ2 Configuration
```nix
# phase0_nixos_setup/example_configuration.nix
{
  # RAIDZ2 with special VDEV for optimal metadata performance
  boot.zfs.pools = {
    tank = {
      type = "raidz2";
      datasets = {
        "data" = {
          mountpoint = "/tank/data";
          compression = "lz4";
          atime = "off";
          xattr = "sa";
          acltype = "posixacl";
        };
        "metadata" = {
          mountpoint = "/tank/metadata";
          # FIXED: special_small_blocks must be >0
          special_small_blocks = "128K";
        };
      };
      devices = [
        # Data VDEVs (RAIDZ2)
        "/dev/disk/by-id/ata-HGST_HUH7280ALE604_..."
        "/dev/disk/by-id/ata-HGST_HUH7280ALE604_..."
        "/dev/disk/by-id/ata-HGST_HUH7280ALE604_..."
        "/dev/disk/by-id/ata-HGST_HUH7280ALE604_..."
        "/dev/disk/by-id/ata-HGST_HUH7280ALE604_..."
        "/dev/disk/by-id/ata-HGST_HUH7280ALE604_..."
        "/dev/disk/by-id/ata-HGST_HUH7280ALE604_..."
        "/dev/disk/by-id/ata-HGST_HUH7280ALE604_..."
        # Special VDEV (SSD) for metadata
        "/dev/disk/by-id/nvme-INTEL_SSDPEKKW..."
      ];
    };
  };
}
```

### Why RAIDZ2?
- **Fault Tolerance**: Can survive 2 drive failures simultaneously
- **Performance**: Good balance of performance and redundancy
- **Capacity**: 2/12 drives used for parity (16% overhead)
- **Suitable**: For archival and data storage workloads

### Special VDEV Configuration
**Purpose**: Small block random I/O optimization

- **Metadata**: Stores ZFS metadata (directories, attributes, small files)
- **Small Files**: Files <128KB stored on SSD for faster access
- **CRITICAL FIX**: `special_small_blocks = "128K"` (NOT "0")

**Performance Impact**:
- **Metadata Operations**: 5-10x faster on SSD
- **Small File Access**: 3-5x faster
- **Random I/O**: Significantly improved

## Compression Algorithms

### LZ4 Compression (Recommended)
```nix
compression = "lz4";  # Default in our config
```

**Characteristics**:
- **Compression Ratio**: ~30-40% average
- **CPU Overhead**: Very low
- **Speed**: Very fast compression/decompression
- **Recommendation**: Best for general-purpose workloads

### Alternative Compression

| Algorithm | Compression Ratio | CPU Overhead | Use Case |
|-----------|-------------------|----------------|----------|
| **LZ4** | 30-40% | Low | Default (recommended) |
| **LZ4 (legacy)** | 30-40% | Low | Not recommended |
| **ZLE** | 10-15% | Very low | Only for testing |
| **ZSTD** | 40-50% | Medium | Better compression, slower |
| **GZIP** | 40-50% | High | CPU-intensive, not recommended |

**Recommendation**: **LZ4** for CloudLab c220g5 (balance of speed and ratio)

## ARC (Adaptive Replacement Cache) Tuning

### Default ARC Behavior
ZFS automatically uses up to 50% of system RAM for ARC.

### CloudLab c220g5: 128GB RAM
- **Default ARC**: Up to 64GB
- **Recommendation**: Keep default for now
- **Monitor**: Adjust based on workload

### ARC Statistics
```bash
# Check ARC statistics
cat /proc/spl/kstat/zfs/arcstats

# Key metrics:
# arc_size: Current ARC size
# arc_hits: Cache hits (good)
# arc_misses: Cache misses (bad)
# arc_hit_ratio: hit_ratio = hits / (hits + misses)

# Good hit ratio: >80%
# Excellent hit ratio: >90%
```

### Advanced ARC Tuning (If Needed)
```nix
# Only tune if monitoring shows issues
boot.kernelParams = {
  "zfs_arc_max" = "64G";  # 50% of 128GB
  "zfs_arc_min" = "8G";   # Ensure minimum cache
};
```

**WARNING**: Only tune after thorough monitoring. Default is usually best.

## Dataset Properties

### Recommended Dataset Configuration
```nix
datasets = {
  "data" = {
    # Performance optimizations
    atime = "off";           # Don't update access time (faster)
    xattr = "sa";            # System attributes (faster)
    acltype = "posixacl";     # POSIX ACLs (compatible)
    compression = "lz4";       # Compression (30-40% space savings)

    # Snapshot management
    mountpoint = "/tank/data";
  };
};
```

### Property Explanation

| Property | Default | Our Value | Impact |
|-----------|----------|------------|--------|
| **atime** | on | off | +10-20% write performance |
| **xattr** | on | sa | +15-30% metadata performance |
| **acltype** | off | posixacl | POSIX compatibility |
| **compression** | off | lz4 | 30-40% space savings |

## Snapshot Strategy

### Snapshot Frequency (Phase 0)
```bash
# Hourly snapshots for 24 hours
zfs snapshot tank/data@$(date +%Y%m%d-%H)

# Daily snapshots for 30 days
zfs snapshot tank/data@$(date +%Y%m%d)

# Monthly snapshots for 12 months
zfs snapshot tank/data@$(date +%Y-%m)
```

### Snapshot Script (Automated)
```bash
#!/bin/bash
# phase0_nixos_setup/scripts/zfs_snapshot.sh

# Hourly snapshots (keep 24)
zfs snapshot tank/data@hourly-$(date +%Y%m%d-%H)

# Daily snapshots (keep 30)
zfs snapshot tank/data@daily-$(date +%Y%m%d)

# Monthly snapshots (keep 12)
zfs snapshot tank/data@monthly-$(date +%Y-%m)

# Prune old snapshots
zfs list -t snapshot -o name,creation | \
  grep "hourly-" | tail -n +25 | \
  xargs -I {} zfs destroy {}
zfs list -t snapshot -o name,creation | \
  grep "daily-" | tail -n +31 | \
  xargs -I {} zfs destroy {}
zfs list -t snapshot -o name,creation | \
  grep "monthly-" | tail -n +13 | \
  xargs -I {} zfs destroy {}
```

### Snapshot Space Management
```bash
# Estimate snapshot space usage
zfs list -o space tank/data

# Monitor snapshot growth
zfs list -t snapshot -o name,used,referenced

# Destroy if growing too large (>10% of dataset)
zfs destroy tank/data@snapshot-name
```

## Scrub Schedule

### Scrub Schedule (Critical)
```bash
# Monthly scrubs (data integrity)
zpool scrub tank

# Check scrub status
zpool status tank

# Check last scrub
zpool status tank | grep "scrub"
```

### Scrub Strategy
- **Monthly scrubs**: Verify data integrity
- **Scrub Duration**: ~1-2 days for 100TB
- **Avoid Overlap**: Don't run multiple scrubs concurrently
- **Monitor**: Check for errors after scrub

### Scrub Automation
```bash
#!/bin/bash
# phase0_nixos_setup/scripts/zfs_scrub.sh

# Check if scrub is already running
zpool status tank | grep "scan: scrub repaired" > /dev/null
if [ $? -eq 0 ]; then
  echo "Scrub in progress, skipping"
  exit 0
fi

# Start scrub
echo "Starting monthly scrub"
zpool scrub tank

# Wait for completion (monitor in background)
watch -n 300 'zpool status tank | grep scrub'
```

## Performance Tuning

### ZFS Intent Log (ZIL)
```nix
# ZIL is on separate SSD (special VDEV)
# No additional configuration needed
```

**ZIL Impact**:
- **Synchronous Writes**: Faster on SSD
- **NFS/SMB**: Significantly improved performance
- **WireGuard**: Benefit from synchronous writes over VPN

### Record Size Tuning
```nix
# Default: 128K (good for most workloads)
# For many small files:
recordsize = "16K";
```

**Record Size Guidance**:
- **General Purpose**: 128K (default)
- **Databases**: 16K-64K
- **Video**: 1M+
- **VM Images**: 128K-256K

## Network Sharing Optimizations

### SMB Over WireGuard
```nix
# FIXED: Use specific IP (not multichannel over VPN)
services.samba.settings = {
  "global" = {
    "hosts allow" = "10.0.0.0/8";  # WireGuard network
    "server min protocol" = "SMB3";
    "server max protocol" = "SMB3";
    "aio read size" = "1048576";     # 1MB
    "aio write size" = "1048576";    # 1MB
    "max xmit" = "1048576";          # 1MB
    "socket options" = "TCP_NODELAY IPTOS_LOWDELAY";
  };
};
```

**Performance Impact**:
- **WireGuard**: Faster over VPN (multichannel doesn't work)
- **SMB3**: Better performance and security
- **AIO**: Async I/O for better throughput
- **TCP Optimizations**: Reduced latency

### NFS Tuning
```nix
services.nfs.server = {
  exports = "/tank/data 10.0.0.0/8(rw,async,no_subtree_check)";
  extraNfsdConfig = ''
    threads 16
    rpc.nfsd -N 8
  '';
};
```

## Backup Strategy

### Offsite Backup with Restic
```bash
# Backup to S3-compatible storage
restic -r s3:s3.amazonaws.com/bucket/path \
  --password-file /root/restic-password \
  backup /tank/data

# Snapshot management (7 days, 4 weeks, 6 months)
restic forget -r s3:s3.amazonaws.com/bucket/path \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 6
```

### Backup Verification (Monthly)
```bash
# Test restore to temporary location
restic restore -r s3:s3.amazonaws.com/bucket/path/latest \
  --target /tmp/restore-test \
  /path/to/test/file

# Verify integrity
diff /path/to/test/file /tmp/restore-test/path/to/test/file

# Clean up
rm -rf /tmp/restore-test
```

## Monitoring ZFS

### Prometheus Node Exporter
```yaml
# prometheus scrape config
scrape_configs:
  - job_name: 'zfs'
    static_configs:
      - targets: ['localhost:9100']
```

### Key Metrics to Monitor
- **zfs_arc_ratio**: ARC hit ratio (target: >80%)
- **zfs_arc_size**: ARC size (monitor for thrashing)
- **zfs_txg_sync**: Transaction group sync time (target: <10s)
- **zpool_scan_progress**: Scrub progress
- **zpool_scan_errors**: Scrub errors (target: 0)

## Troubleshooting

### Common Issues

#### 1. Slow Performance
```bash
# Check ARC hit ratio
cat /proc/spl/kstat/zfs/arcstats | grep arc_hit_ratio

# If <50%, increase RAM or tune dataset
zfs set primarycache=all tank/data
```

#### 2. Pool Degraded
```bash
# Check pool status
zpool status tank

# Replace failed drive
zpool replace tank /dev/failed /dev/new

# Resilver in progress
zpool status tank | grep resilver
```

#### 3. Snapshot Space Growing
```bash
# Check snapshot space
zfs list -o space tank/data

# Destroy old snapshots
zfs destroy tank/data@old-snapshot
```

## Performance Benchmarks

### Expected Performance (CloudLab c220g5)
| Operation | Performance | Notes |
|-----------|-------------|-------|
| **Sequential Write** | ~150 MB/s | HDD limit |
| **Sequential Read** | ~180 MB/s | HDD limit |
| **Random Read (SSD metadata)** | ~5000 IOPS | SSD limit |
| **Random Read (HDD)** | ~80 IOPS | HDD limit |
| **Small File Creation** | 3-5x faster | SSD special VDEV |

---

**Last Updated**: 2026-01-12

**For AI Agents**: When tuning ZFS:
1. Always test changes in staging first
2. Monitor metrics before/after
3. Document all changes
4. Have rollback plan ready (ZFS snapshots)
5. Consider workload characteristics (sequential vs random)
