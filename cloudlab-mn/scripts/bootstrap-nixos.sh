#!/usr/bin/env bash
set -euo pipefail

# bootstrap-nixos.sh
# DANGER: WIPES ALL DISKS on the target machine.
# Usage: ./bootstrap-nixos.sh <target-host>

TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 <target-host>"
  exit 1
fi

echo "WARNING: This will WIPE ALL DATA on $TARGET and install NixOS."
echo "Press Ctrl+C to cancel, or Enter to proceed..."
read -r

# Function to run commands on remote
remote() {
  ssh root@"$TARGET" "$@"
}

# 1. Kexec / Inject NixOS (Simplified placeholder - assumes we are in the NixOS installer or can run these commands)
# In reality, we might need to use nixos-infect or kexec images. 
# For this script, we assume we have root access and tools.

# Upload configuration
echo "Uploading config..."
scp infra/*.nix root@"$TARGET":/tmp/

# Execute Partitioning & Install
ssh root@"$TARGET" 'bash -s' << 'EOF'
set -x

# DISK IDENTIFICATION (Adapting to CloudLab c220g5)
# NVMe drives
NVME1=$(ls /dev/nvme0n1 2>/dev/null || echo "")
NVME2=$(ls /dev/nvme1n1 2>/dev/null || echo "")

if [[ -z "$NVME1" || -z "$NVME2" ]]; then
  echo "ERROR: Could not find 2 NVMe drives."
  exit 1
fi

# HDDs (Assuming sda..sdn for 14 drives, strictly example)
# REAL IMPLEMENTATION NEEDS 'lsblk' verification
HDDS=(/dev/sd{a..n}) 

# PARTITIONING (Copied from environment_setup_plan_2026.md)

# Wipe NVMe
sgdisk -Z $NVME1
sgdisk -Z $NVME2

# NVMe 1
sgdisk $NVME1 \
    -n 1:0:+512M  -c 1:EFI \
    -n 2:0:+32G   -c 2:Swap \
    -n 3:0:+200G  -c 3:Nix \
    -n 4:0:+1600G -c 4:rpool \
    -n 5:0:+64G   -c 5:Special

# NVMe 2
sgdisk $NVME2 \
    -n 1:0:+512M  -c 1:EFI \
    -n 2:0:+32G   -c 2:Swap \
    -n 3:0:+200G  -c 3:Nix \
    -n 4:0:+1600G -c 4:rpool \
    -n 5:0:+64G   -c 5:Special

# Formatting
mkfs.vfat -F32 -n BOOT ${NVME1}p1
mkfs.ext4 -L NIX ${NVME1}p3
mkswap -L SWAP ${NVME1}p2
swapon ${NVME1}p2

# ZFS rpool
zpool create -f -o ashift=12 -o autoexpand=on \
    -O compression=zstd-3 -O xattr=sa -O atime=off \
    -O mountpoint=/ \
    rpool mirror ${NVME1}p4 ${NVME2}p4

# ZFS Datasets
zfs create rpool/nix
zfs create rpool/home
zfs create rpool/persist

# Mounts for Install
mount -t zfs rpool/root /mnt
mkdir -p /mnt/boot
mount ${NVME1}p1 /mnt/boot
mkdir -p /mnt/nix
mount ${NVME1}p3 /mnt/nix

# Install
nixos-generate-config --root /mnt
cp /tmp/configuration.nix /mnt/etc/nixos/configuration.nix
# (Adjust hardware-configuration.nix if needed)

# nixos-install --no-root-passwd # (User configured via keys)
echo "Install Logic Placeholder - halting before destructive real install."
EOF
