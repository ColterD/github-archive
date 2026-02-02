# 03: Unikernel Deployment

> **Prerequisites**: QEMU/KVM installed, Linux 5.10+
> **Estimated Time**: 45 minutes
> **Difficulty**: Advanced
> **Feasibility**: Partial (Limited GPU support)

---

## Overview

This guide covers deploying cognitive modules as unikernels (Nanos/OSv) for:

- Minimal memory footprint (< 10MB)
- Fast boot times (< 100ms)
- Reduced attack surface
- Maximum performance on CloudLab c220g5

---

## Why Unikernels?

| Metric | Linux Container | Nanos Unikernel | OSv Unikernel |
|--------|-----------------|----------------|---------------|
| **Boot time** | 1-2s | 50-100ms | 80-150ms |
| **Memory** | 50-100MB | 5-10MB | 8-15MB |
| **Syscalls** | 300+ | ~100 | ~120 |
| **Attack surface** | Large | Tiny | Tiny |
| **GPU support** | ✅ Native | ⚠️ Experimental | ✅ VFIO |

---

## Prerequisites

### Hardware Verification

```bash
# Check VT-x/AMD-V support
lscpu | grep Virtualization
# Expected: VT-x or AMD-V

# Check KVM
lsmod | grep kvm
# Expected: kvm_intel or kvm_amd

# Check IOMMU (for GPU passthrough)
dmesg | grep -e DMAR -e IOMMU
# Expected: DMAR: IOMMU enabled
```

---

## Nanos Unikernel Deployment

### Installation

```bash
# Install Ops (Nanos CLI)
curl -s https://ops.city/get.sh | bash

# Install QEMU
sudo apt-get install qemu-kvm libvirt-daemon-system libvirt-clients

# Verify
ops version
# Expected: ops 0.x.x
```

### Create Nanos Unikernel

```bash
# Create unikernel from Python
ops pkg load python310

# Compile cognitive module
cd cognitive_modules
ops init cognitive_core
ops build cognitive_core.py -v

# Package as unikernel image
ops instance create cognitive_core-image -p 8080 -i cognitive_core
```

### Nanos Configuration

```yaml
# config.yaml
config:
  bootargs: "console=ttyS0"
  environment:
    - key: RUST_LOG
      value: debug
  manifest:
    - target: /python/cognitive_core.py
      source: cognitive_core.py
  runConfig:
    env: []
```

---

## OSv Unikernel Deployment

### Installation

```bash
# Clone OSv
git clone https://github.com/cloudius-systems/osv.git
cd osv

# Build OSv
./scripts/build.py --release
```

### Create OSv Application

```bash
# Create Python application
./scripts/run.py -e python3 -c "print('Hello OSv')"

# Build with cognitive modules
./scripts/build.py -e python3 -c cognitive_core.py

# Package as QEMU image
qemu-img convert -f raw -O qcow2 build/release/loader.qemu osv_cognitive.qcow2
```

---

## GPU Passthrough (Tesla P4)

### IOMMU Configuration

```bash
# Enable IOMMU in GRUB
# Edit /etc/default/grub:
GRUB_CMDLINE_LINUX="intel_iommu=on iommu=pt vfio-pci.ids=10de:1bb3,10de:10f0"

# Update GRUB
sudo update-grub
sudo reboot

# Verify
dmesg | grep -i iommu
```

### VFIO Binding

```bash
# Bind GPU to VFIO
echo "10de 1bb3" > /sys/bus/pci/drivers/vfio-pci/new_id
echo "10de 10f0" > /sys/bus/pci/drivers/vfio-pci/new_id

# Verify
lspci -nnk -d 10de:1bb3
```

### QEMU with GPU Passthrough

```bash
qemu-system-x86_64 \
  -machine q35,accel=kvm \
  -cpu host \
  -m 4096 \
  -drive file=osv_cognitive.qcow2,format=qcow2,if=virtio \
  -device vfio-pci,host=01:00.0 \
  -net nic,model=virtio \
  -net user,hostfwd=tcp::8080-:8080
```

---

## Feasibility Notes for CloudLab c220g5

### What Works

✅ **Nanos CPU-only unikernels**: Fast, stable, excellent for cognitive logic
✅ **OSv with VFIO GPU**: Supports Tesla P4 passthrough
✅ **Network passthrough**: SR-IOV for 40Gbps NIC

### What's Challenging

⚠️ **Nanos GPU support**: Experimental, requires manual kernel patching
⚠️ **CUDA in unikernels**: Driver dependencies are complex
⚠️ **Hot reloading**: Unikernels don't support hot code reload

### Recommendation

- Use **unikernels for CPU-only cognitive modules** (Neurotransmitters, Global Workspace)
- Use **native Linux containers for GPU workloads** (inference, training)

---

## Alternative: Lightweight Containers

If unikernels prove too complex:

```dockerfile
# Distroless Python
FROM gcr.io/distroless/python3-debian12

COPY cognitive_core.py /app/
COPY requirements.txt /app/

CMD ["python3", "/app/cognitive_core.py"]
```

**Tradeoffs**:
- Boot: 500ms vs 100ms (Nanos)
- Memory: 20MB vs 8MB (Nanos)
- GPU: Full support

---

## Benchmarks

| Metric | Linux | Docker | Nanos | OSv |
|--------|-------|--------|-------|-----|
| **Boot time** | 30s | 1-2s | 100ms | 150ms |
| **Memory** | 2GB | 100MB | 8MB | 12MB |
| **Syscalls** | 300+ | 300+ | ~100 | ~120 |
| **Throughput** | 100% | 98% | 95% | 97% |

---

## Common Issues

### Issue: Unikernel won't boot

**Problem**: QEMU hangs on "SeaBIOS"

**Solution**:
```bash
# Check bootargs
ops bootargs "console=ttyS0,reboot=k panic=1"

# Enable verbose logging
ops build -v cognitive_core.py
```

### Issue: No network access

**Problem**: Cannot connect to external services

**Solution**:
```bash
# Enable NAT networking
ops instance create --net cognitive_core-image

# Or bridge mode
ops instance create --net-bridge br0 cognitive_core-image
```

### Issue: GPU passthrough fails

**Problem**: `Device or resource busy`

**Solution**:
```bash
# Unbind GPU from host
echo "0000:01:00.0" > /sys/bus/pci/devices/0000:01:00.0/driver/unbind

# Check IOMMU groups
ls -l /sys/kernel/iommu_groups/
```

---

## Sources

- nanovms.com/docs
- cloudius-systems.github.io/osv
- docs.qemu.org

---

## Next Steps

- [04: Ray Cluster Setup](./04_ray_cluster_setup.md)
- [troubleshooting_edge_performance.md](./troubleshooting_edge_performance.md)
