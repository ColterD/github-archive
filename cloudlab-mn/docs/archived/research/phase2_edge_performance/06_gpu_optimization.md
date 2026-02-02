# 06: GPU Optimization

> **Hardware**: Tesla P4 (8GB, 2560 CUDA cores)
> **Estimated Time**: 30 minutes
> **Difficulty**: Intermediate

---

## Overview

This guide covers optimizing the Tesla P4 for cognitive workloads:

- CUDA configuration
- GPU memory management
- Inference optimization
- Batch processing

---

## Tesla P4 Specifications

| Feature | Specification |
|---------|---------------|
| **CUDA Cores** | 2560 |
| **Memory** | 8GB GDDR5 |
| **Memory Bandwidth** | 192 GB/s |
| **FP32 Performance** | 5.5 TFLOPS |
| **FP16 Performance** | 11 TFLOPS |
| **Max Power** | 75W |

---

## Driver Installation

### NVIDIA Driver

```bash
# Check CUDA toolkit version
nvidia-smi
# Expected output includes driver version and CUDA version

# If driver not installed:
sudo apt-add-repository ppa:graphics-drivers/ppa
sudo apt update
sudo apt install nvidia-driver-535
sudo reboot

# Verify
nvidia-smi
```

### CUDA Toolkit

```bash
# Download CUDA Toolkit (NixOS)
# In configuration.nix:
{ config, pkgs, ... }:
{
  hardware.opengl.enable = true;
  hardware.nvidia.open = false;
  services.xserver.videoDrivers = [ "nvidia" ];

  environment.systemPackages = with pkgs; [
    cudaPackages.cudatoolkit
    cudaPackages.cudnn
    cudaPackages.tensorrt
  ];
}
```

---

## GPU Configuration

### NVIDIA Settings

```bash
# Check GPU capabilities
nvidia-smi --query-gpu=cuda_version,driver_version,memory.total --format=csv
```

### Persistence Mode

```bash
# Enable persistence mode (reduces startup overhead)
sudo nvidia-smi -pm 1

# Verify
nvidia-smi -q -d PERSISTENCE_MODE
```

### Power Management

```bash
# Set maximum power limit
sudo nvidia-smi -pl 75  # 75W (Tesla P4 max)

# Set performance mode
sudo nvidia-smi -pm 1
sudo nvidia-smi -ac "5001,1530"  # Boost clocks (memory, core)

# Verify
nvidia-smi -q -d CLOCK
```

---

## PyTorch GPU Setup

```python
import torch

# Verify CUDA availability
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA device count: {torch.cuda.device_count()}")
print(f"Current device: {torch.cuda.current_device()}")
print(f"Device name: {torch.cuda.get_device_name(0)}")

# Set default device
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
```

---

## Inference Optimization

### FP16 Inference

```python
# Enable mixed precision (faster, slightly less accurate)
model = model.to(device)
model.half()  # Convert to FP16

input_tensor = input_tensor.half().to(device)

with torch.no_grad():
    output = model(input_tensor)  # Faster inference
```

### Batch Inference

```python
# Process multiple inputs at once
batch_size = 32
inputs = torch.randn(batch_size, 3, 224, 224).to(device)

with torch.no_grad():
    outputs = model(inputs)  # Vectorized computation
```

### torch.compile (PyTorch 2.0+)

```python
# Compile model for speed
model = torch.compile(model, mode="reduce-overhead")

# First call is slow (compilation), subsequent calls are fast
output = model(input_tensor)
```

---

## Memory Management

### Memory Monitoring

```python
import torch

def print_gpu_memory():
    allocated = torch.cuda.memory_allocated(0) / 1024**3  # GB
    reserved = torch.cuda.memory_reserved(0) / 1024**3   # GB
    print(f"Allocated: {allocated:.2f}GB / Reserved: {reserved:.2f}GB")

print_gpu_memory()
```

### Memory Optimization

```python
# Clear cache after batch
with torch.no_grad():
    outputs = model(inputs)
    
torch.cuda.empty_cache()  # Free unused memory
```

### Gradient Checkpointing

```python
# Reduce memory during training (not inference)
from torch.utils.checkpoint import checkpoint

def forward(x):
    x = checkpoint(layer1, x)
    x = checkpoint(layer2, x)
    return x
```

---

## Ray + GPU Integration

### Ray GPU Scheduling

```python
import ray

@ray.remote(num_gpus=1)
class GPUInferenceActor:
    def __init__(self, model_path: str):
        self.device = torch.device("cuda:0")
        self.model = torch.load(model_path).to(self.device)
        self.model.half()  # FP16
    
    def inference(self, inputs: torch.Tensor):
        with torch.no_grad():
            inputs = inputs.half().to(self.device)
            outputs = self.model(inputs)
        return outputs.cpu()
```

### Multiple GPUs

```bash
# Start Ray with GPU resources
ray start --head --num-gpus=2

# Or specify per-actor GPUs
@ray.remote(num_gpus=0.5)  # Share GPU between actors
class SharedGPUActor:
    pass
```

---

## TensorRT Optimization

```python
import tensorrt as trt
from torch2trt import torch2trt

# Convert PyTorch model to TensorRT
model = MyModel().cuda().eval()
model_trt = torch2trt(model, [example_input])

# Use TensorRT model (much faster)
with torch.no_grad():
    output = model_trt(input_tensor)
```

### TensorRT Performance

| Backend | Latency | Throughput | Memory |
|----------|---------|------------|--------|
| **PyTorch FP32** | 10ms | 100 img/s | 2GB |
| **PyTorch FP16** | 5ms | 200 img/s | 1.5GB |
| **TensorRT FP16** | 2ms | 500 img/s | 1GB |

---

## Benchmark Script

```python
# benchmarks/gpu_benchmark.py
import torch
import time

def benchmark_inference(model, input_tensor, iterations=100):
    model = model.cuda().half().eval()
    input_tensor = input_tensor.half().cuda()
    
    # Warmup
    with torch.no_grad():
        for _ in range(10):
            _ = model(input_tensor)
    
    # Benchmark
    times = []
    with torch.no_grad():
        for _ in range(iterations):
            start = time.perf_counter()
            _ = model(input_tensor)
            times.append(time.perf_counter() - start)
    
    avg = sum(times) / len(times) * 1000  # ms
    return avg

# Usage
model = torch.load("model.pt")
input_tensor = torch.randn(1, 3, 224, 224)
avg_time = benchmark_inference(model, input_tensor)
print(f"Average inference time: {avg_time:.2f}ms")
```

---

## Performance Targets

### Tesla P4 Optimized Performance

| Workload | Target | Achievable |
|----------|--------|------------|
| **Image inference (224x224)** | < 5ms | ✅ 2-3ms (TensorRT FP16) |
| **Batch inference (32)** | < 100ms | ✅ 60-80ms |
| **GPU utilization** | > 80% | ✅ 85-90% |
| **Memory usage** | < 4GB | ✅ 2-3GB |

---

## Common Issues

### Issue: CUDA out of memory

**Problem**: `RuntimeError: CUDA out of memory`

**Solution**:
```python
# Reduce batch size
batch_size = 16  # From 32

# Use gradient checkpointing (training)
from torch.utils.checkpoint import checkpoint

# Clear cache
torch.cuda.empty_cache()
```

### Issue: GPU not utilized

**Problem**: Low GPU utilization (< 10%)

**Solution**:
```bash
# Check GPU mode
nvidia-smi

# Disable integrated graphics
sudo prime-select nvidia
sudo reboot
```

### Issue: Slow inference

**Problem**: Inference time > 10ms

**Solution**:
```python
# Enable FP16
model.half()

# Use torch.compile
model = torch.compile(model)

# Use TensorRT
model = torch2trt(model, [input_tensor])
```

---

## Limitations

### Tesla P4 Specific Limitations

- **No FP16 Tensor Cores**: Tesla P4 has FP16 but not dedicated Tensor Cores like V100/A100
- **8GB Memory**: Limited for large models (LLMs)
- **75W Power**: Not as powerful as 250W+ cards

### Recommended Alternatives

For larger models:
- NVIDIA T4 (16GB, 2560 cores)
- NVIDIA V100 (32GB, 5120 cores)
- NVIDIA A100 (40GB, 6912 cores)

---

## Sources

- developer.nvidia.com
- docs.nvidia.com/deeplearning/tensorrt
- pytorch.org/docs/stable/cuda.html

---

## Next Steps

- [Troubleshooting](./troubleshooting_edge_performance.md)
- [Runbook](./runbook_wasm_deployment.md)
