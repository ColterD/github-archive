# Runbook: Quick Start (1-Hour Setup)

## Overview
Accelerated setup guide for experienced users.

**Time**: 1 hour (assuming prerequisites met)

## Quick Setup (60 Minutes)

### Minute 0-5: Verify Hardware (5 min)
```bash
lscpu
free -h
lsblk
ip link show
```

### Minute 5-15: Partition & ZFS (10 min)
```bash
# Clear disks
for dev in /dev/nvme{0..3}n1; do wipefs -a $dev; done

# Create EFI partition
sgdisk -n 1:1M:+512M -t 1:EF00 /dev/nvme0n1

# Create ZFS pool
modprobe zfs
zpool create -f -o ashift=12 -O compression=lz4 zroot raidz2 \
    /dev/nvme0n1p2 /dev/nvme1n1 /dev/nvme2n1 /dev/nvme3n1

# Create datasets
zfs create -o mountpoint=legacy -o canmount=noauto zroot/root
zfs create -o mountpoint=legacy zroot/nix
zfs create -o mountpoint=legacy zroot/home
zfs create -o mountpoint=legacy zroot/data

# Mount
mount -t zfs zroot/root /mnt
mkdir -p /mnt/{nix,home,data}
mount -t zfs zroot/nix /mnt/nix
mount -t zfs zroot/home /mnt/home
mount -t zfs zroot/data /mnt/data
```

### Minute 15-20: Generate Config (5 min)
```bash
nixos-generate-config --root /mnt
# Edit /mnt/etc/nixos/configuration.nix with your settings
```

### Minute 20-45: Install NixOS (25 min)
```bash
nixos-install
```

### Minute 45-50: Reboot (5 min)
```bash
zpool export zroot
reboot
```

### Minute 50-60: Post-Install (10 min)
```bash
# Set root password
passwd

# Create user
useradd -m -G wheel admin
passwd admin

# Enable sudo
EDITOR=nano visudo

# Configure SSH
ssh-copy-id admin@localhost

# Verify
nixos-version
zpool status
```

## Post-Setup Checklist
- [ ] ZFS healthy
- [ ] Network working
- [ ] SSH access OK
- [ ] User can sudo
- [ ] Time synced
- [ ] Updates applied

## Next Steps
- Complete network configuration
- Set up monitoring
- Harden security
- Install developer tools

---
**Version**: 1.0.0
