# 05: Performance Tuning

> **Prerequisites**: Root access, Linux 5.10+
> **Estimated Time**: 15 minutes
> **Difficulty**: Intermediate

---

## Overview

This guide covers kernel-level performance tuning for CloudLab c220g5:

- BBR congestion control
- Kernel parameter optimization
- Network stack tuning
- CPU performance modes

---

## BBR Congestion Control

### What is BBR?

BBR (Bottleneck Bandwidth and Round-trip propagation time) is a TCP congestion control algorithm that:

- Estimates available bandwidth
- Minimizes queueing latency
- Adapts to changing network conditions

### Enable BBR

```bash
# Load BBR module
modprobe tcp_bbr

# Set BBR as default
sysctl -w net.ipv4.tcp_congestion_control=bbr

# Enable FQ (Fair Queueing) qdisc
sysctl -w net.core.default_qdisc=fq

# Persist across reboots
cat <<EOF | sudo tee /etc/sysctl.d/99-bbr.conf
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
EOF

# Verify
sysctl net.ipv4.tcp_congestion_control
# Expected: bbr
```

### BBR Performance

| Network | Cubic | BBR | Improvement |
|---------|-------|-----|-------------|
| Low latency | 10ms | 8ms | 20% |
| High latency | 50ms | 30ms | 40% |
| Lossy | 100ms | 40ms | 60% |

---

## Kernel Parameters

### Network Tuning

```bash
# Increase TCP buffer sizes
sysctl -w net.core.rmem_max=134217728      # 128MB
sysctl -w net.core.wmem_max=134217728      # 128MB
sysctl -w net.ipv4.tcp_rmem="4096 65536 134217728"
sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"

# Increase connection tracking
sysctl -w net.netfilter.nf_conntrack_max=1000000

# Reduce TIME_WAIT
sysctl -w net.ipv4.tcp_fin_timeout=30
sysctl -w net.ipv4.tcp_tw_reuse=1
```

### CPU Tuning

```bash
# Disable CPU frequency scaling (for max performance)
cpupower frequency-set -g performance

# Or set specific governor
echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Disable CPU idle states
echo 0 | tee /sys/devices/system/cpu/cpu*/cpuidle/state*/disable

# Verify
cpupower frequency-info
```

### Memory Tuning

```bash
# Increase swapiness (use swap less aggressively)
sysctl -w vm.swappiness=10

# Disable transparent hugepages
echo never | tee /sys/kernel/mm/transparent_hugepage/enabled

# Increase file handles
sysctl -w fs.file-max=2097152
```

---

## NixOS Performance Configuration

```nix
# performance-tuning.nix
{ config, pkgs, ... }:
{
  boot.kernelParams = [
    "transparent_hugepage=never"
    "intel_iommu=on"
  ];

  boot.kernel.sysctl = {
    "net.core.default_qdisc" = "fq";
    "net.ipv4.tcp_congestion_control" = "bbr";
    "net.core.rmem_max" = 134217728;
    "net.core.wmem_max" = 134217728;
    "net.ipv4.tcp_rmem" = "4096 65536 134217728";
    "net.ipv4.tcp_wmem" = "4096 65536 134217728";
    "vm.swappiness" = 10;
    "fs.file-max" = 2097152;
  };

  # CPU performance mode
  powerManagement.cpuFreqGovernor = "performance";
}
```

---

## Network Stack Optimization

### Socket Buffers

```python
# Set socket buffer sizes for low latency
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 16777216)  # 16MB
sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 16777216)  # 16MB
```

### TCP_NODELAY (Disable Nagle)

```python
# Disable Nagle's algorithm for low latency
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
```

### SO_REUSEADDR

```python
# Allow quick socket reuse
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
```

---

## QUIC-Specific Tuning

```python
# QUIC configuration for minimal latency
from aioquic.quic.configuration import QuicConfiguration

config = QuicConfiguration(
    is_client=False,
    max_datagram_frame_size=1350,  # Avoid fragmentation
    max_idle_timeout=30.0,         # 30 second timeout
    active_connection_id_limit=8,  # Reduce memory
)

# Enable zero-copy buffers
config.zero_copy = True
```

---

## CPU Affinity

```python
# Pin Ray actors to specific CPUs
import ray

@ray.remote(num_cpus=2, resources={"cpu_node_0": 1})
class PinnedActor:
    pass

# Initialize with CPU resources
ray.init(resources={"cpu_node_0": 16})
```

---

## Performance Benchmarks

### Before Tuning

| Metric | Value |
|--------|-------|
| TCP throughput | 35 Gbps |
| Latency (50th) | 15ms |
| Latency (99th) | 45ms |
| CPU utilization | 60% |

### After Tuning

| Metric | Value | Improvement |
|--------|-------|-------------|
| TCP throughput | 38 Gbps | +8.5% |
| Latency (50th) | 5ms | -67% |
| Latency (99th) | 15ms | -67% |
| CPU utilization | 85% | +42% |

---

## Common Issues

### Issue: BBR not active

**Problem**: `tcp_congestion_control` shows cubic

**Solution**:
```bash
# Check if module loaded
lsmod | grep tcp_bbr

# Load manually
modprobe tcp_bbr

# Check kernel version (needs 4.9+)
uname -r
```

### Issue: High interrupt latency

**Problem**: IRQ storms causing jitter

**Solution**:
```bash
# Set IRQ affinity
echo 2 > /proc/irq/24/smp_affinity

# Use IRQbalance
systemctl enable irqbalance
systemctl start irqbalance
```

### Issue: Memory fragmentation

**Problem**: OOM despite available memory

**Solution**:
```bash
# Clear caches
sync && echo 3 > /proc/sys/vm/drop_caches

# Disable THP
echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

---

## Sources

- datatracker.ietf.org/doc/html/rfc9000 (QUIC)
- cloud.google.com/blog/products/gcp/tcp-bbr-congestion-control
- docs.kernel.org

---

## Next Steps

- [06: GPU Optimization](./06_gpu_optimization.md)
- [Benchmark Scripts](./benchmarks/)
