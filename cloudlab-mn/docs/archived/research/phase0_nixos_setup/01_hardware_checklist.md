# 01: Hardware Checklist for CloudLab c220g5

## Overview
This document provides a comprehensive checklist for verifying the CloudLab c220g5 hardware.

**Time to Complete**: 15 minutes

## Hardware Specifications

### CPU
- Model: 2× Intel Xeon E5-2650 v4
- Cores: 12 per CPU (24 total)
- Threads: 24 per CPU (48 total)
- Base Clock: 2.2 GHz
- Virtualization: VT-x, VT-d

### Memory
- Total: 256 GB DDR4 ECC
- Type: DDR4-2400 ECC Registered
- Configuration: 8× 32 GB DIMMs

### Storage
- Drives: 4× 1.92 TB NVMe SSD
- Interface: PCIe 3.0 x4
- Sequential Read: Up to 3,000 MB/s

### Network
- NICs: 2× Mellanox ConnectX-4 Lx
- Ports: 4× SFP+ (10 GbE each)
- Driver: mlx5_core

## Verification Commands

### CPU
```bash
lscpu
nproc
grep -E 'vmx|svm' /proc/cpuinfo
```

### Memory
```bash
free -h
dmidecode -t memory | grep -E "Size|Speed|Type"
numactl --hardware
```

### Storage
```bash
lsblk
sudo nvme smart-log /dev/nvme0
sudo hdparm -Tt /dev/nvme0
```

### Network
```bash
ip link show
ethtool -i enP2p1s0f0
ethtool enP2p1s0f0 | grep "Speed:"
ibv_devinfo
```

## Known Issues

### Mellanox Driver Not Loaded
```bash
sudo modprobe mlx5_core
echo 'mlx5_core' | sudo tee -a /etc/modules-load.d/mellanox.conf
```

## Links
- [CloudLab Hardware](https://www.cloudlab.us/hardware.php)
- [Intel Xeon E5-2650](https://ark.intel.com/products/91768)

---
**Version**: 1.0.0 | **Updated**: 2025-01-12
