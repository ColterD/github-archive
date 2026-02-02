# NixOS Installation Guide (2026 Architecture)

> **Target Hardware:** CloudLab c220g5 (or equivalent) with 2× 2TB NVMe + 14× 12TB HDD
> **Architecture:** Imperishable Root (tmpfs + persist) + ZFS rpool + ember pool with Special VDEV
> **OpenZFS Version:** 2.4.0 (latest stable, released December 2025)

---

## Phase 1: Boot NixOS Installer

1. **Boot standard CloudLab disk image**
2. **Get root shell:** `sudo -i`
3. **Set keyboard layout (if needed):** `loadkeys us`

---

## Phase 2: Identify Disks

```bash
# List all disks to identify your NVMe and HDD devices
lsblk -f

# Note the disk IDs for:
# - 2× NVMe drives (for partitioning)
# - 14× HDD drives (for ember pool)

# Get disk-by-id paths (preferred for persistent configuration)
ls -la /dev/disk/by-id/

# Example output (adjust to your hardware):
# nvme-Samsung_SSD_970_EVO_2TB_S4EWNX0M712345 -> ../../nvme0n1
# nvme-Samsung_SSD_970_EVO_2TB_S4EWNX0M712346 -> ../../nvme1n1
# ata-HDD_Seagate_... (×14)
```

**For this guide, we'll use:**
- `nvme-A` = First NVMe drive (replace with actual disk-by-id)
- `nvme-B` = Second NVMe drive (replace with actual disk-by-id)

---

## Phase 3: Partition NVMe Drives

```bash
# Install partitioning tools
nix-shell -p gptfdisk

# === Partition first NVMe drive ===
# 2026 Updated: Reduced EFI (512MB), increased /nix (200GB), reduced Special VDEV (64GB)
sgdisk /dev/disk/by-id/nvme-A \
  -n 1:0:+512M  -c 1:EFI \
  -n 2:0:+32G   -c 2:Swap \
  -n 3:0:+200G  -c 3:Nix \
  -n 4:0:+1600G -c 4:rpool \
  -n 5:0:+64G   -c 5:Special

# === Partition second NVMe drive (mirrored layout) ===
sgdisk /dev/disk/by-id/nvme-B \
  -n 1:0:+512M  -c 1:EFI \
  -n 2:0:+32G   -c 2:Swap \
  -n 3:0:+200G  -c 3:Nix \
  -n 4:0:+1600G -c 4:rpool \
  -n 5:0:+64G   -c 5:Special

# Verify partitions
sgdisk -p /dev/disk/by-id/nvme-A
sgdisk -p /dev/disk/by-id/nvme-B
```

**Partition Layout Explained (2026 Optimized):**
| Partition | Size | Purpose | 2026 Change |
|-----------|------|---------|--------------|
| p1 (EFI) | 512MB | Boot loader | Reduced from 2GB (sufficient) |
| p2 (Swap) | 32GB | Emergency overflow | Unchanged |
| p3 (Nix) | 200GB | Nix store (packages) | Increased from 128GB (growth room) |
| p4 (rpool) | ~1.6TB | Unified NVMe pool (apps, VMs, databases) | Increased from Special VDEV reduction |
| p5 (Special) | 64GB | Special VDEV for ember pool | Reduced from 250GB (properly sized) |

**2026 Sizing Best Practices:**
- **EFI:** 512MB is sufficient for multiboot NixOS scenarios
- **/nix:** 200GB accounts for NixOS 25.05+ store growth
- **Special VDEV:** 0.5-2.5% of pool capacity (64GB is generous for 120TB pool)

---

## Phase 4: Format Partitions

```bash
# Format EFI partition (only on first drive - will be mirrored content)
mkfs.vfat -F32 -n BOOT /dev/disk/by-id/nvme-A-part1

# Format Nix partition (ext4, only on first drive)
mkfs.ext4 -L NIX /dev/disk/by-id/nvme-A-part3

# Create swap (only on first drive)
mkswap -L SWAP /dev/disk/by-id/nvme-A-part2
swapon /dev/disk/by-id/nvme-A-part2
```

---

## Phase 5: Create ZFS Pools

```bash
# Load ZFS kernel module
modprobe zfs

# === Create rpool (Unified NVMe Pool - SERVER-ONLY) ===
zpool create -o ashift=12 -o autoexpand=on \
  -O compression=zstd-3 -O xattr=sa -O atime=off \
  -O mountpoint=/rpool \
  rpool mirror /dev/disk/by-id/nvme-A-part4 /dev/disk/by-id/nvme-B-part4

# Create rpool datasets
zfs create rpool/apps        # Applications (*arr stack, UniFi, etc.)
zfs create rpool/vms         # VMs/LXC containers
zfs create rpool/databases   # FalkorDB, PostgreSQL, MongoDB
zfs create rpool/builds      # Build artifacts
zfs create -o mountpoint=/persist rpool/persist  # NixOS persist

# === Create ember pool (HDD RAIDZ2 with Special VDEV) ===
# 2026 Updated: Two 7-wide RAIDZ2 vdevs (optimal for 14 disks, +9 TB capacity)
# NOTE: Adjust the HDD disk-by-id paths to match your hardware
zpool create -o ashift=12 -o autoexpand=on \
  -O compression=zstd-3 -O xattr=sa -O atime=off \
  -O recordsize=1M \
  ember \
  raidz2 /dev/disk/by-id/ata-HDD_1 /dev/disk/by-id/ata-HDD_2 /dev/disk/by-id/ata-HDD_3 \
        /dev/disk/by-id/ata-HDD_4 /dev/disk/by-id/ata-HDD_5 /dev/disk/by-id/ata-HDD_6 \
        /dev/disk/by-id/ata-HDD_7 \
  raidz2 /dev/disk/by-id/ata-HDD_8 /dev/disk/by-id/ata-HDD_9 /dev/disk/by-id/ata-HDD_10 \
        /dev/disk/by-id/ata-HDD_11 /dev/disk/by-id/ata-HDD_12 /dev/disk/by-id/ata-HDD_13 \
        /dev/disk/by-id/ata-HDD_14 \
  special mirror /dev/disk/by-id/nvme-A-part5 /dev/disk/by-id/nvme-B-part5

# === Configure Special VDEV per-dataset (CRITICAL FIX) ===
# DO NOT set special_small_blocks globally! Set per-dataset instead.
# This ensures correct data placement: blocks ≤ special_small_blocks go to Special VDEV

# Create ember datasets (shared via SMB to Minnesota client)
zfs create ember/code
zfs set recordsize=16K ember/code
zfs set special_small_blocks=16K ember/code  # MUST match recordsize for code!

zfs create ember/models
zfs set recordsize=1M ember/models
zfs set special_small_blocks=32K ember/models  # OK: 32K < 1M

zfs create ember/media
zfs set recordsize=1M ember/media
zfs set special_small_blocks=32K ember/media  # OK: 32K < 1M

# Verify pools
zpool status
zfs list
zpool list -v  # Shows special vdev allocation
```

**2026 Configuration Notes:**
- **RAIDZ2 vs dRAID:** Traditional RAIDZ2 is optimal for 14 disks (+9 TB capacity, better small-file performance)
- **Special VDEV Sizing:** 64GB is 0.5-2.5% of 120TB pool (generous, properly sized per 2026 research)
- **special_small_blocks BUG:** Must be set per-dataset, not globally. Global setting with 16K recordsize sends ALL data to Special VDEV!

---

## Phase 6: Mount Filesystems for Installation

```bash
# Mount rpool persist (will become /persist in NixOS)
mount /dev/disk/by-id/nvme-A-part3 /mnt

# Create mount points
mkdir -p /mnt/boot
mkdir -p /mnt/nix
mkdir -p /mnt/persist

# Mount filesystems
mount /dev/disk/by-id/nvme-A-part1 /mnt/boot
mount /dev/disk/by-id/nvme-A-part3 /mnt/nix
# Note: /persist will be configured as ZFS dataset in NixOS config

# Generate host ID for ZFS
head -c4 /dev/urandom | od -A none -t x4 | xargs | read ZFS_HOST_ID
echo "ZFS host ID: $ZFS_HOST_ID (save this for configuration.nix)"
```

---

## Phase 7: Generate NixOS Configuration

```bash
# Generate initial hardware configuration
nixos-generate-config --root /mnt

# Edit configuration.nix
nano /mnt/etc/nixos/configuration.nix
```

**Add/Edit the following in configuration.nix:**

```nix
# === ADD TO configuration.nix ===

# Boot configuration
boot.lanzaboote = {
  enable = true;
  pkiBundle = "/etc/secureboot";
};
boot.loader.efi.canTouchEfiVariables = true;

# ZFS host ID (replace with your generated ID)
networking.hostId = "8425e349";  # Or your generated ID

# Filesystem configuration
fileSystems."/" = {
  device = "none";
  fsType = "tmpfs";
  options = [ "defaults" "size=2G" "mode=755" ];  # 2026: Reduced to 2G to prevent OOM
};

fileSystems."/boot" = {
  device = "/dev/disk/by-id/BOOT";
  fsType = "vfat";
};

fileSystems."/nix" = {
  device = "/dev/disk/by-id/NIX";
  fsType = "ext4";
};

fileSystems."/persist" = {
  device = "rpool/persist";
  fsType = "zfs";
  neededForBoot = true;
};

# ZFS support
boot.supportedFilesystems = [ "zfs" ];
boot.zfs.forceImportRoot = false;

# Disable root filesystem (imperishable root)
# Add your user, SSH, services, etc. below
```

---

## Phase 8: Install NixOS

```bash
# Install NixOS
nixos-install

# Reboot
reboot
```

---

## Phase 9: Post-Installation Configuration

After reboot, configure your system:

```bash
# Generate WireGuard keys
nix-shell -p wireguard-tools --run "wg genkey | tee privatekey | wg pubkey > publickey"

# Configure WireGuard (see configuration.nix for template)

# Configure Samba shares
# Configure SOPS secrets
# Configure services (FalkorDB, Infisical, Forgejo, etc.)
```

---

## Phase 10: Minnesota Client Setup (Windows 11)

On your Windows 11 machine:

```powershell
# === Format Local Dev Drive (D:\) ===
# Open PowerShell as Administrator

# Initialize and format as Dev Drive
Format-Volume -DriveLetter D -FileSystem ReFS -NewFileSystemLabel "DevDrive" -DevDrive $true

# Exclude from Defender Real-Time Protection
# Settings → Virus & threat protection → Exclusions → Add D:\

# === Map Network Drives (after WireGuard VPN is up) ===

# Enable SMB 3.1.1 multichannel
Set-SmbClientConfiguration -EnableMultiChannel $true

# Map network drives (replace SERVER with your server hostname/IP)
New-PSDrive -Name "Z" -Root "\\server\code" -PSProvider FileSystem -Persist
New-PSDrive -Name "M" -Root "\\server\models" -PSProvider FileSystem -Persist
New-PSDrive -Name "A" -Root "\\server\media" -PSProvider FileSystem -Persist

# Performance tuning
Set-SmbClientConfiguration -DirectoryCacheEntriesMax 1024
Set-SmbClientConfiguration -FileNotFoundCacheEntriesMax 128
```

---

## Verification Checklist

- [ ] NVMe drives partitioned correctly (p1-p5 on both drives)
- [ ] EFI partition formatted (vfat, 512MB)
- [ ] Nix partition formatted (ext4, 200GB)
- [ ] Swap created and active
- [ ] rpool created and mounted (ZFS, mirrored)
- [ ] ember pool created with Special VDEV (two 7-wide RAIDZ2 vdevs)
- [ ] All datasets created (code, models, media) with per-dataset special_small_blocks
- [ ] NixOS installed successfully
- [ ] System reboots into NixOS
- [ ] Tmpfs root mounted with size=2G limit
- [ ] WireGuard VPN configured
- [ ] Samba shares accessible from Minnesota
- [ ] Network drives mapped (Z:, M:, A:)

**2026-Specific Verifications:**
- [ ] Usable capacity: ~120 TB (not 111 TB - RAIDZ2 vs dRAID)
- [ ] Special VDEV allocation: Check with `zpool list -v` (should show minimal usage initially)
- [ ] special_small_blocks: Verify per-dataset with `zfs get all ember | grep special_small_blocks`
- [ ] OpenZFS version: `zfs version` should show 2.4.0 or later

---

## Troubleshooting

### ZFS import fails on boot
```bash
# Force import (emergency only)
zpool import -f rpool
zpool import -f ember

# Check ZFS kernel module
lsmod | grep zfs
```

### Partition size issues
```bash
# Check actual partition sizes
sgdisk -p /dev/disk/by-id/nvme-A

# Reclaim space if needed
sgdisk --move-second-header /dev/disk/by-id/nvme-A
```

### Special VDEV not working
```bash
# Check OpenZFS version (must be 2.3+ for Special VDEV, 2.4.0 recommended)
zfs version

# Verify special_small_blocks is set per-dataset
zfs get all ember | grep special_small_blocks
# Should show:
#   ember/code  special_small_blocks  16K
#   ember/models  special_small_blocks  32K
#   ember/media  special_small_blocks  32K

# Check special vdev allocation
zpool list -v
# Should show special vdev with space allocation
```

### Wrong data going to Special VDEV
```bash
# SYMPTOM: All files going to Special VDEV instead of just metadata/small files
# CAUSE: special_small_blocks > recordsize (common bug!)

# Check your settings:
zfs get recordsize ember/code        # Should be 16K
zfs get special_small_blocks ember/code  # Should ALSO be 16K!

# If special_small_blocks > recordsize, ALL data goes to Special VDEV
# FIX: Set special_small_blocks equal to or less than recordsize
zfs set special_small_blocks=16K ember/code  # For 16K recordsize
```

---

## References

- [OpenZFS Documentation](https://openzfs.github.io/openzfs-docs/)
- [NixOS Manual](https://nixos.org/manual/nixos/stable/)
- [ZFS Special VDEV Guide](https://github.com/openzfs/zfs/issues/10800)
