# Troubleshooting: Edge & Performance

> **Purpose**: Common issues and solutions for Phase 2 deployment
> **Last Updated**: January 2026

---

## Quick Reference

| Issue | Category | Quick Fix |
|-------|----------|-----------|
| WasmEdge SIGSEGV | WASM | Disable AVX: `export RUSTFLAGS="-C target-cpu=generic"` |
| QUIC handshake fails | Network | Enable HTTP/3: `sysctl -w net.core.somaxconn=1024` |
| Ray OOM | Compute | Limit memory: `ray.init(object_store_memory=64e9)` |
| Unikernel won't boot | Unikernel | Check IOMMU: `ls -l /dev/vfio/` |
| GPU not detected | GPU | Verify driver: `nvidia-smi` |
| BBR not active | Network | Load module: `modprobe tcp_bbr` |

---

## WasmEdge Issues

### SIGSEGV on Startup

**Symptom**:
```
Segmentation fault (core dumped)
```

**Cause**: AVX instruction set incompatibility

**Solutions**:
```bash
# Disable AVX
export RUSTFLAGS="-C target-cpu=generic"

# Rebuild WasmEdge
cargo clean && cargo build --release

# Or use prebuilt binary
curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install.sh | bash
```

### NumPy Import Error

**Symptom**:
```
ModuleNotFoundError: No module named 'numpy'
```

**Cause**: NumPy not compiled for WASM

**Solutions**:
```bash
# Install WASI-NumPy
wasmedge-tensorflow-plugin install

# Or use alternative: wasi-numpy
pip install wasi-numpy

# Verify
wasmedge-python -c "import numpy; print(numpy.__version__)"
```

### Network Access Denied

**Symptom**:
```
ConnectionRefusedError: [Errno 111] Connect call failed
```

**Cause**: WASI sandbox blocking network

**Solutions**:
```bash
# Grant network permissions
wasmedge --enable-sandbox cognitive_core.wasm

# Or use wasi-socket plugin
wasmedge-plugin-wasi-socket install

# Verify network access
wasmedge-python -c "import socket; s = socket.socket(); print(s.connect(('8.8.8.8', 53)))"
```

### Slow Cold Start

**Symptom**: WasmEdge takes > 1 second to start

**Cause**: AOT compilation not enabled

**Solutions**:
```bash
# Pre-compile WASM
wasmedge compile cognitive_core.wasm -o cognitive_core_aot.wasm

# Use AOT version
wasmedge cognitive_core_aot.wasm

# Or use WasmEdge image with pre-warmed runtime
docker pull ghcr.io/wasmedge/wasmedge:latest-full
```

---

## QUIC/HTTP3 Issues

### QUIC Handshake Fails

**Symptom**:
```
ALPN protocol not supported
```

**Cause**: HTTP/3 not enabled in kernel

**Solutions**:
```bash
# Enable HTTP/3
sysctl -w net.core.somaxconn=1024
sysctl -w net.ipv4.tcp_fastopen=3

# Install aioquic
pip install aioquic

# Enable HTTP/3 in application
configuration.alpn_protocols = ["h3"]
```

### High Latency (> 10ms)

**Symptom**: QUIC latency similar to TCP

**Cause**: BBR not enabled

**Solutions**:
```bash
# Enable BBR
modprobe tcp_bbr
sysctl -w net.ipv4.tcp_congestion_control=bbr
sysctl -w net.core.default_qdisc=fq

# Verify
sysctl net.ipv4.tcp_congestion_control
# Expected: bbr
```

### Connection Drops

**Symptom**: QUIC connections dropping frequently

**Cause**: Idle timeout too short

**Solutions**:
```python
# Increase idle timeout
from aioquic.quic.configuration import QuicConfiguration

config = QuicConfiguration(
    max_idle_timeout=60.0  # 60 seconds
)
```

---

## Unikernel Issues

### Unikernel Won't Boot

**Symptom**: QEMU hangs on "SeaBIOS"

**Cause**: Boot arguments incorrect

**Solutions**:
```bash
# Check bootargs
ops bootargs "console=ttyS0,reboot=k panic=1"

# Enable verbose logging
ops build -v cognitive_core.py

# Check kernel image
file build/loader.qemu
# Expected: QEMU boot image
```

### No Network Access

**Symptom**: Cannot connect to external services

**Cause**: Network not configured

**Solutions**:
```bash
# Enable NAT networking
ops instance create --net cognitive_core-image

# Or bridge mode
ops instance create --net-bridge br0 cognitive_core-image

# Check network config
ops config show
```

### GPU Passthrough Fails

**Symptom**: `Device or resource busy`

**Cause**: GPU bound to host driver

**Solutions**:
```bash
# Unbind GPU from host
echo "0000:01:00.0" > /sys/bus/pci/devices/0000:01:00.0/driver/unbind

# Check IOMMU groups
ls -l /sys/kernel/iommu_groups/

# Verify VFIO
lspci -nnk -d 10de:1bb3
```

---

## Ray Issues

### OutOfMemoryError

**Symptom**:
```
OutOfMemoryError: Cannot allocate X bytes
```

**Cause**: Object store too large

**Solutions**:
```bash
# Limit object store
ray.init(object_store_memory=64e9)  # 64GB

# Or restart Ray with lower limit
ray stop
ray start --head --object-store-memory=64e9
```

### GPU Not Detected

**Symptom**:
```
No GPU available
```

**Cause**: CUDA driver not installed or Ray not configured

**Solutions**:
```bash
# Verify CUDA
nvidia-smi

# Check Ray resources
ray.available_resources()
# Expected: {'GPU': 1.0, ...}

# Reinstall Ray with GPU support
pip install ray[rllib]==2.9.0
```

### Actor Placement Failure

**Symptom**:
```
No available resource for actor
```

**Cause**: Insufficient resources

**Solutions**:
```bash
# Check available resources
ray status

# Reduce resource requirements
@ray.remote(num_cpus=1, num_gpus=0)
class ResourceActor:
    pass

# Or add custom resources
ray.init(resources={"custom_resource": 4})
```

### Slow Actor Spawn

**Symptom**: Actors taking > 100ms to spawn

**Cause**: Cold start, no pre-warmed pool

**Solutions**:
```python
# Pre-warm actor pool
@ray.remote
class ActorPool:
    actors = []
    for _ in range(100):
        actors.append(Actor.remote())
```

---

## GPU Issues

### CUDA Out of Memory

**Symptom**:
```
RuntimeError: CUDA out of memory
```

**Cause**: Model or batch size too large

**Solutions**:
```python
# Reduce batch size
batch_size = 16  # From 32

# Use gradient checkpointing (training)
from torch.utils.checkpoint import checkpoint

# Clear cache
torch.cuda.empty_cache()
```

### GPU Not Utilized

**Symptom**: GPU utilization < 10%

**Cause**: Data not on GPU

**Solutions**:
```python
# Move data to GPU
device = torch.device("cuda:0")
input_tensor = input_tensor.to(device)

# Verify
print(input_tensor.device)
# Expected: cuda:0
```

### Slow Inference

**Symptom**: Inference > 10ms on Tesla P4

**Cause**: FP32 instead of FP16

**Solutions**:
```python
# Enable FP16
model.half()
input_tensor = input_tensor.half()

# Use torch.compile
model = torch.compile(model)

# Use TensorRT
from torch2trt import torch2trt
model_trt = torch2trt(model, [input_tensor])
```

---

## Network Issues

### Low Throughput (< 10 Gbps)

**Symptom**: Actual throughput much lower than 40Gbps

**Cause**: Buffer sizes too small

**Solutions**:
```bash
# Increase TCP buffers
sysctl -w net.core.rmem_max=134217728
sysctl -w net.core.wmem_max=134217728
sysctl -w net.ipv4.tcp_rmem="4096 65536 134217728"
sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"
```

### High Jitter

**Symptom**: Latency varies widely (5ms to 50ms)

**Cause**: CPU frequency scaling

**Solutions**:
```bash
# Disable power management
cpupower frequency-set -g performance

# Verify
cpupower frequency-info
# Expected: governor: performance
```

---

## Kernel Issues

### BBR Not Active

**Symptom**:
```
sysctl net.ipv4.tcp_congestion_control
# Returns: cubic
```

**Cause**: Module not loaded

**Solutions**:
```bash
# Check if module exists
modinfo tcp_bbr

# Load module
modprobe tcp_bbr

# Set as default
sysctl -w net.ipv4.tcp_congestion_control=bbr

# Persist
echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.conf
```

### High Interrupt Latency

**Symptom**: `cat /proc/interrupts` shows high counts

**Cause**: IRQ storms

**Solutions**:
```bash
# Set IRQ affinity
echo 2 > /proc/irq/24/smp_affinity

# Use IRQbalance
systemctl enable irqbalance
systemctl start irqbalance

# Verify
watch cat /proc/interrupts
```

---

## Docker Issues

### Container Won't Start

**Symptom**: `Error: Container startup failed`

**Cause**: WasmEntry not executable

**Solutions**:
```bash
# Check entrypoint
docker inspect emily-cognitive-wasm | grep Entrypoint

# Fix Dockerfile
ENTRYPOINT ["wasmedge", "--dir", "/app", "/app/cognitive_core.wasm"]

# Rebuild
docker build -t emily-cognitive-wasm:latest .
```

### Permission De
