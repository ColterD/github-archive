# Troubleshooting Guide

## Common Issues & Solutions

## Installation Issues

### Issue: Cannot boot from ISO
**Solutions:**
1. Check BIOS boot order
2. Verify ISO integrity with sha256sum
3. Try USB boot instead of network

### Issue: ZFS pool won't create
```bash
# Check if devices are clear
lsblk
wipefs -a /dev/nvme0n1

# Check ZFS module
lsmod | grep zfs
modprobe zfs

# Try with different ashift
zpool create -f -o ashift=9 zroot raidz2 /dev/nvme0n1 /dev/nvme1n1 /dev/nvme2n1 /dev/nvme3n1
```

### Issue: Installation fails
```bash
# Check logs
journalctl -xe

# Check disk space
df -h

# Retry installation
nixos-install
```

## Network Issues

### Issue: Cannot connect via SSH
```bash
# Check if SSH is running
systemctl status sshd

# Check firewall
sudo nft list ruleset

# Test from server
curl http://google.com
```

### Issue: Bond not working
```bash
# Check bond status
cat /proc/net/bonding/bond0

# Check interfaces
ip link show

# Recreate bond
ip link delete bond0
```

### Issue: WireGuard not connecting
```bash
# Check WireGuard status
wg show

# Check keys
cat /etc/wireguard/privatekey

# Check firewall
sudo iptables -L | grep 51820
```

## Storage Issues

### Issue: ZFS pool degraded
```bash
# Check pool status
zpool status

# Resilver
zpool scrub zroot

# Replace failed drive
zpool replace zroot /dev/nvme3n1
```

### Issue: Cannot import pool
```bash
# Import with force
zpool import -f zroot

# Import readonly
zpool import -o readonly=on zroot

# Check for lock
zpool export zroot
```

## Performance Issues

### Issue: Slow network
```bash
# Check link speed
ethtool enP2p1s0f0

# Check for errors
ip -s link show enP2p1s0f0

# Test bandwidth
iperf3 -c <server> -t 30
```

### Issue: Slow disk I/O
```bash
# Check ZFS ARC
cat /proc/spl/kstat/zfs/arcstats | grep size

# Check compression ratio
zfs get compressratio zroot

# Adjust ARC
sysctl zfs.zfs_arc_max=17179869184
```

## Recovery

### Emergency Reboot
```bash
# Force reboot (if system frozen)
echo 1 > /proc/sys/kernel/sysrq
echo b > /proc/sysrq-trigger
```

### Boot into Single User
1. Add `single` to kernel parameters in bootloader
2. Boot and mount filesystems
3. Fix configuration
4. Reboot normally

### Reset Root Password
1. Boot from installation media
2. Mount root: `mount /dev/zroot/root /mnt`
3. Chroot: `chroot /mnt`
4. Change password: `passwd`

## System Rollback

```bash
# List generations
sudo nix-env --list-generations --profile /nix/var/nix/profiles/system

# Roll back to previous
sudo nixos-rebuild switch --rollback

# Rollback to specific generation
sudo nix-env --switch-generation <number> -p /nix/var/nix/profiles/system
```

## Get Help
- Check logs: `journalctl -xe`
- NixOS Discourse: https://discourse.nixos.org/
- NixOS Wiki: https://nixos.wiki/

---
**Version**: 1.0.0
