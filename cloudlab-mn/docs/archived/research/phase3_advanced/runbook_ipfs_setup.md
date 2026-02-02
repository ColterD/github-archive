# IPFS Setup Runbook

**Purpose**: Step-by-step guide for setting up IPFS on NixOS
**Date**: 2026-01-12
**Estimate**: 4-6 hours

---

## Prerequisites

- NixOS 23.05 or later
- ZFS pool with 2TB+ available space
- 4+ CPU cores recommended
- 16GB+ RAM
- 100GB/month bandwidth allocation

---

## Step 1: Prepare ZFS Storage

```bash
# 1.1 Check available ZFS space
zpool list
zfs list

# 1.2 Create dedicated IPFS dataset
sudo zfs create zpool/ipfs

# 1.3 Configure ZFS properties for IPFS
sudo zfs set compression=lz4 zpool/ipfs
sudo zfs set atime=off zpool/ipfs
sudo zfs set xattr=sa zpool/ipfs
sudo zfs set dedup=off zpool/ipfs
sudo zfs set recordsize=128K zpool/ipfs

# 1.4 Verify configuration
zfs get all zpool/ipfs

# Expected output:
# compression         lz4
# atime               off
# xattr               sa
# dedup               off
# recordsize           128K
```

---

## Step 2: Install IPFS on NixOS

```nix
# /etc/nixos/configuration.nix
{ config, pkgs, ... }:

{
  # Enable IPFS service
  services.ipfs = {
    enable = true;
    autoMount = true;
    dataDir = "/mnt/zpool/ipfs";
    user = "ipfs";
    group = "ipfs";
    
    extraFlags = [
      "--enable-pubsub-experiment"
      "--enable-namesys-pubsub"
      "--migrate"
      "--routing=dht"
    ];
    
    enableGC = true;
    autoMigrate = true;
  };
  
  # Open firewall ports
  networking.firewall.allowedTCPPorts = [ 4001 ];
  networking.firewall.allowedUDPPorts = [ 4001 ];
}
```

```bash
# Apply configuration
sudo nixos-rebuild switch

# Verify IPFS is running
sudo systemctl status ipfs
```

---

## Step 3: Initialize IPFS

```bash
# 3.1 Initialize IPFS repository
sudo -u ipfs ipfs init

# 3.2 Generate secure key
sudo -u ipfs ipfs key gen emily-key --type rsa --size 4096

# 3.3 Configure IPFS
sudo -u ipfs ipfs config --json Addresses.Gateway "/ip4/127.0.0.1/tcp/8080"
sudo -u ipfs ipfs config --json Addresses.API "/ip4/127.0.0.1/tcp/5001"
sudo -u ipfs ipfs config --json Experimental.PubsubEnabled true
sudo -u ipfs ipfs config --json Experimental.ShardingEnabled true
sudo -u ipfs ipfs config --json Datastore.StorageMax "2TB"
sudo -u ipfs ipfs config --json Datastore.StorageGCWatermark 90

# 3.4 Restart IPFS
sudo systemctl restart ipfs
```

---

## Step 4: Verify IPFS Installation

```bash
# 4.1 Check IPFS is running
ipfs id

# Expected output: JSON with peer ID, addresses, protocols

# 4.2 Check connected peers
ipfs swarm peers

# Expected: List of connected peers (may be 0 initially)

# 4.3 Test IPFS
echo "Hello Emily" > /tmp/test.txt
ipfs add /tmp/test.txt

# Expected: Output with CID (Qm...)

# 4.4 Test retrieval
ipfs cat Qm... > /tmp/test-retrieved.txt
cat /tmp/test-retrieved.txt

# Expected: "Hello Emily"
```

---

## Step 5: Configure IPFS Gateway

```nix
# /etc/nixos/configuration.nix (add to existing)
{
  services.nginx = {
    enable = true;
    
    virtualHosts."ipfs.local" = {
      listen = [ { addr = "0.0.0.0"; port = 8080; } ];
      locations."/" = {
        proxyPass = "http://127.0.0.1:8080";
        extraConfig = ''
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
        '';
      };
    };
  };
}
```

```bash
# Apply and verify
sudo nixos-rebuild switch
curl http://localhost:8080/ipfs/Qm...
```

---

## Step 6: Configure Bandwidth Limits

```bash
# 6.1 Set connection limits
sudo -u ipfs ipfs config --json Swarm.ConnMgr.LowWater 50
sudo -u ipfs ipfs config --json Swarm.ConnMgr.HighWater 100

# 6.2 Set gateway bandwidth limit
sudo -u ipfs ipfs config --json Gateway.MaxUploadSize 53687091200  # 50GB

# 6.3 Restart IPFS
sudo systemctl restart ipfs

# 6.4 Monitor bandwidth
ipfs swarm bandwidth
```

---

## Step 7: Set Up Monitoring

```bash
# 7.1 Create IPFS metrics exporter
cat > /usr/local/bin/ipfs_metrics_exporter.sh << 'EOF'
#!/bin/bash
while true; do
  REPO_SIZE=$(ipfs repo stat | grep "RepoSize" | awk '{print $2}')
  PEERS=$(ipfs swarm peers | wc -l)
  
  curl --data-binary "ipfs_repo_size_bytes $REPO_SIZE" \
    http://localhost:9091/metrics/job/ipfs
  
  curl --data-binary "ipfs_peers_count $PEERS" \
    http://localhost:9091/metrics/job/ipfs
  
  sleep 60
done
