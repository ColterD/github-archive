# 02: NixOS Installation

## Overview
Complete guide for installing NixOS on CloudLab c220g5.

**Time**: 2-3 hours

## Installation Steps

### 1. Download NixOS ISO
```bash
wget https://channels.nixos.org/nixos-24.11/latest-nixos-minimal-x86_64-linux.iso
sha256sum latest-nixos-minimal-x86_64-linux.iso
```

### 2. Boot from Installation Media
- Access CloudLab console
- Reboot into BIOS/UEFI
- Select USB/PXE boot with NixOS ISO
- Login as root

### 3. Verify Hardware
```bash
lscpu
free -h
lsblk
ip link show
```

### 4. Partition Disks for ZFS
```bash
# Clear partitions (DESTRUCTIVE)
wipefs -a /dev/nvme0n1
wipefs -a /dev/nvme1n1
wipefs -a /dev/nvme2n1
wipefs -a /dev/nvme3n1

# Create EFI partition
sgdisk -n 1:1M:+512M -t 1:EF00 /dev/nvme0n1
```

### 5. Create ZFS Pool
See [04_storage_setup.md](04_storage_setup.md) for details.

```bash
modprobe zfs
zpool create -f -o ashift=12 -O compression=lz4 zroot raidz2 \
    /dev/nvme0n1p2 /dev/nvme1n1 /dev/nvme2n1 /dev/nvme3n1

zfs create -o mountpoint=legacy zroot/root
zfs create -o mountpoint=legacy zroot/nix
zfs create -o mountpoint=legacy zroot/home

mount -t zfs zroot/root /mnt
mkdir -p /mnt/{nix,home}
mount -t zfs zroot/nix /mnt/nix
mount -t zfs zroot/home /mnt/home
```

### 6. Generate Configuration
```bash
nixos-generate-config --root /mnt
# Edit /mnt/etc/nixos/configuration.nix
```

### 7. Install NixOS
```bash
nixos-install
```

### 8. Reboot
```bash
zpool export zroot
reboot
```

## Troubleshooting
See [troubleshooting_guide.md](troubleshooting_guide.md)

## Next Steps
[03_network_configuration.md](03_network_configuration.md)

---
**Version**: 1.0.0
