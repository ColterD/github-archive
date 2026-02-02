# 04: Storage Setup (ZFS)

## Overview
ZFS pool creation with RAIDZ2.

**Time**: 1 hour

## Design
- Pool: RAIDZ2 (2-disk parity)
- Capacity: ~4 TB usable (4× 1.92 TB)
- Compression: lz4
- ARC: 32 GB

## Pool Creation

```bash
# Create RAIDZ2 pool
zpool create -f \
    -o ashift=12 \
    -O compression=lz4 \
    -O atime=off \
    -O xattr=sa \
    -O acltype=posixacl \
    -O mountpoint=none \
    zroot raidz2 \
    /dev/nvme0n1p2 \
    /dev/nvme1n1 \
    /dev/nvme2n1 \
    /dev/nvme3n1

# Create datasets
zfs create -o mountpoint=legacy -o canmount=noauto zroot/root
zfs create -o mountpoint=legacy zroot/nix
zfs create -o mountpoint=legacy zroot/home
zfs create -o mountpoint=legacy zroot/var
zfs create -o mountpoint=legacy zroot/data

# Mount
mount -t zfs zroot/root /mnt
mkdir -p /mnt/{nix,home,var,data}
mount -t zfs zroot/nix /mnt/nix
mount -t zfs zfs zroot/home /mnt/home
mount -t zfs zfs zroot/var /mnt/var
mount -t zfs zroot/data /mnt/data
```

## NixOS Configuration
```nix
{ config, pkgs, ... }:
{
  boot.supportedFilesystems = [ "zfs" ];
  
  services.zfs.autoScrub.enable = true;
  services.zfs.autoSnapshot.enable = true;
  
  fileSystems = {
    "/" = { device = "zroot/root"; fsType = "zfs"; };
    "/nix" = { device = "zroot/nix"; fsType = "zfs"; };
    "/home" = { device = "zroot/home"; fsType = "zfs"; };
    "/var" = { device = "zroot/var"; fsType = "zfs"; };
    "/data" = { device = "zroot/data"; fsType = "zfs"; };
  };
  
  boot.kernelParams = [ "zfs.zfs_arc_max=34359738368" ];
}
```

## Monitoring
```bash
zpool status
zpool iostat -v 1
zfs list
```

## Snapshots
```bash
zfs snapshot zroot/data@$(date +%Y%m%d)
zfs list -t snapshot
zfs rollback zroot/data@snapshot-name
```

---
**Version**: 1.0.0
