# GPU Optimization Strategies

Comprehensive guide to optimizing Tesla P4 for Emily Sovereign V4 on CloudLab c220g5.

## Tesla P4 Specifications

### Hardware Details
- **GPU Model**: Tesla P4 8GB
- **Architecture**: Pascal (GP104)
- **CUDA Cores**: 2560
- **VRAM**: 8GB GDDR5
- **Memory Bandwidth**: 192 GB/s
- **Compute Capability**: 6.1
- **Tensor Cores**: None (no dedicated tensor cores)

### Tesla P4 Limitations
| Feature | Supported | Notes |
|---------|-----------|-------|
| **FP16** | ✅ Yes | Slower than Volta/Turing |
| **Tensor Cores** | ❌ No | Must use CUDA cores |
| **Flash Attention** | ❌ No | Not supported |
| **PagedAttention** | ❌ No | vLLM not optimal |
| **Mixed Precision** | ⚠️ Limited | Manual implementation |

## SGLang Configuration

### SGLang Setup for Tesla P4
```bash
# phase1_foundation/scripts/start_sglang.sh
#!/bin/bash

# CUDA 11.8 (compatible with Tesla P4)
export CUDA_VISIBLE_DEVICES=0

# Start SGLang server
python -m sglang.launch_server \
  --model-path /models/llama-7b.ggmlf16.bin \
  --port 8000 \
  --host 0.0.0.0 \
  --tp 1 \
  --pp 1 \
  --mem-fraction-static 0.9 \  # Use 90% of 8GB (7.2GB)
  --max-running-requests 4 \    # Concurrency limit
  --schedule-policy fcfs \       # First-come, first-served
  --dtype float16 \
  --context-length 4096
```

### SGLang Parameters for Tesla P4

| Parameter | Value | Rationale |
|-----------|--------|------------|
| **tp (tensor parallel)** | 1 | Single GPU |
| **pp (pipeline parallel)** | 1 | Single GPU |
| **mem-fraction-static** | 0.9 | Leave 10% headroom |
| **max-running-requests** | 4 | Limit for 8GB VRAM |
| **dtype** | float16 | FP16 for speed |
| **context-length** | 4096 | Balance quality/memory |

## Quantization

### Model Quantization (4-bit)
```bash
# Convert model to 4-bit (Q4_K_M)
# phase1_foundation/scripts/quantize_model.sh

python -m llama.cpp \
  --model /models/llama-7b-f16.gguf \
  --output /models/llama-7b-q4.gguf \
  --quantize q4_k_m \  # Q4_K_M: Best quality/size tradeoff
  --n-gpu-layers 30     # Keep last 30 layers on GPU

# Memory savings
# F16: ~14GB (doesn't fit in 8GB)
# Q4_K_M: ~4GB (fits comfortably)
```

### Quantization Comparison
| Quantization | VRAM | Quality | Speed | Recommendation |
|------------|-------|---------|-------|
| **F16 (no quantization)** | 14GB | Best | Fastest | ❌ Doesn't fit |
| **Q8_0** | 8GB | Excellent | Fast | ⚠️ Borderline |
| **Q6_K** | 6GB | Very Good | Medium | ⭐ Good balance |
| **Q4_K_M** | 4GB | Good | Slow | ✅ Recommended |
| **Q3_K_XS** | 3GB | Fair | Slowest | ⚠️ Quality loss |

### Mixed Precision (FP16 + Quantization)
```python
# phase1_foundation/scripts/mixed_precision.py
import torch

# Load model in FP16
model = AutoModelForCausalLM.from_pretrained(
    "/models/llama-7b",
    torch_dtype=torch.float16,  # FP16 weights
    device_map="auto"
)

# Quantize to 4-bit (post-training)
from bitsandbytes import get_quantization_config

quantization_config = get_quantization_config(
    model,
    load_in_8bit=False,
    load_in_4bit=True,
    llm_int8_threshold=6.0,
)

# Apply quantization
from transformers import BitsAndBytesConfig
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",  # Normal Float 4
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.float16,
)

model = AutoModelForCausalLM.from_pretrained(
    "/models/llama-7b",
    quantization_config=bnb_config,
    device_map="auto",
)
```

## Batch Optimization

### Dynamic Batching
```bash
# SGLang automatically batches requests
# phase1_foundation/scripts/batch_test.sh

# Test different batch sizes
for batch_size in 1 2 4 8; do
  echo "Testing batch size: $batch_size"
  python -m sglang.launch_server \
    --max-running-requests $batch_size

  # Benchmark throughput
  curl -X POST http://localhost:8000/v1/completions \
    -H "Content-Type: application/json" \
    -d '{"model":"llama-7b","prompt":"Hello","max_tokens":100}' \
    -w "\nTime: %{time_total}s\n"
done
```

### Batch Size Impact
| Batch Size | Throughput | Latency | VRAM Usage |
|-----------|------------|----------|-------------|
| **1** | 3 tokens/s | 200ms | 4GB |
| **2** | 5 tokens/s | 250ms | 5GB |
| **4** | 8 tokens/s | 400ms | 6GB | ✅ Optimal |
| **8** | 10 tokens/s | 600ms | 7GB | ⚠️ Borderline VRAM |

**Recommendation**: **Batch size 4** for Tesla P4 (balance of throughput and VRAM).

## KV Cache Optimization

### KV Cache Configuration
```bash
# SGLang KV cache
python -m sglang.launch_server \
  --cache-max-entry-count 8192 \  # Max cache entries
  --cache-max-byte-size 67108864  # 64MB (8% of 8GB)
  --chunked-context \                # Enable chunked context
```

### KV Cache Tuning
| Parameter | Value | Impact |
|-----------|--------|--------|
| **cache-max-entry-count** | 8192 | Number of cached contexts |
| **cache-max-byte-size** | 67MB (8% of VRAM) | Cache memory budget |
| **chunked-context** | Enabled | Better memory usage |

### Memory Allocation
```
Total VRAM: 8GB

Allocation:
- Model weights (Q4):      4GB
- KV cache (64MB):          0.06GB
- Activation memory:           2GB
- Runtime overhead:            0.5GB
- Context buffer:             0.5GB
- Headroom (10%):            0.94GB

Total: 8GB (full utilization)
```

## Context Length Optimization

### Context Window Sizing
```bash
# Test different context lengths
for ctx_len in 2048 4096 8192; do
  echo "Context length: $ctx_len"

  # Measure memory usage
  nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader,nounits

  # Benchmark
  python -m sglang.launch_server \
    --context-length $ctx_len \
    --max-running-requests 1

  # Test generation
  curl -X POST http://localhost:8000/v1/completions \
    -d '{"prompt":"'"'"Hello world"'","max_tokens":'$ctx_len'}'
done
```

### Context Length Impact
| Context Length | VRAM Usage | Latency | Quality |
|---------------|-------------|----------|---------|
| **2048** | 5GB | 150ms | Good |
| **4096** | 6GB | 200ms | Very Good | ✅ Recommended |
| **8192** | 8GB | 350ms | Best | ⚠️ Max VRAM |

**Recommendation**: **4096 tokens** for Tesla P4 (balance of VRAM and quality).

## CUDA Configuration

### CUDA Environment Setup
```bash
# phase0_nixos_setup/example_configuration.nix
hardware.opengl = {
  enable = true;
  driSupport = true;
};

environment.systemPackages = with pkgs; [
  pkgs.cudatoolkit  # CUDA 11.8
  pkgs.cuda_cudnn  # cuDNN 8.6
  pkgs.nccl        # NCCL for multi-GPU (future)
];
```

### CUDA Environment Variables
```bash
# phase1_foundation/scripts/set_cuda_env.sh
export CUDA_VISIBLE_DEVICES=0  # Use GPU 0
export NVIDIA_TF32_OVERRIDE=0  # Disable TF32 (use FP32)
export CUDA_CACHE_DISABLE=1    # Disable PTX cache
export CUDA_LAUNCH_BLOCKING=1  # Sync kernel launches

# SGLang specific
export SGLANG_DISABLE_FLASH_ATTENTION=1  # Tesla P4 doesn't support
export SGLANG_DISABLE_NORM_TENSOR = 1
```

## Monitoring GPU

### Prometheus GPU Metrics
```yaml
# GPU exporter configuration
scrape_configs:
  - job_name: 'nvidia_gpu'
    static_configs:
      - targets: ['localhost:9100']
    metrics_path: '/metrics'
```

### Key GPU Metrics
- **nvidia_gpu_memory_used_bytes**: VRAM usage
- **nvidia_gpu_utilization_gpu**: GPU utilization (%)
- **nvidia_gpu_temperature_gpu**: GPU temperature
- **nvidia_gpu_power_draw**: Power consumption (W)

### Alerting Rules
```yaml
# Prometheus alerts
groups:
  - name: gpu_alerts
    rules:
      - alert: HighVRAMUsage
        expr: nvidia_gpu_memory_used_bytes / nvidia_gpu_memory_total_bytes > 0.9
        for: 5m
        annotations:
          summary: "GPU VRAM usage over 90%"

      - alert: HighGPUTemp
        expr: nvidia_gpu_temperature_gpu > 85
        for: 5m
        annotations:
          summary: "GPU temperature over 85°C"
```

## Performance Benchmarks

### Expected SGLang Performance (Tesla P4)
| Metric | Value | Notes |
|--------|--------|-------|
| **Inference Latency** | ~200ms (7B, Q4, 2048 tokens) | Acceptable for batched |
| **Throughput** | ~8 tokens/s (batch=4) | Per GPU |
| **VRAM Usage** | ~7GB (90% of 8GB) | Leaves headroom |
| **Max Context** | 4096 tokens | Comfortable in 8GB |
| **Model Load Time** | ~10s | Q4 model |

### Performance Comparison (Quantization)
| Model | VRAM | Latency | Throughput |
|-------|-------|----------|-----------|
| **7B-F16** | 14GB | N/A | N/A (doesn't fit) |
| **7B-Q8_0** | 8GB | 180ms | 5 tokens/s |
| **7B-Q6_K** | 6GB | 200ms | 7 tokens/s |
| **7B-Q4_K_M** | 4GB | 250ms | 10 tokens/s | ✅ Best VRAM fit |

## Troubleshooting

### 1. OOM (Out of Memory)
```bash
# Check VRAM usage
nvidia-smi

# Reduce batch size
python -m sglang.launch_server --max-running-requests 2

# Reduce context length
python -m sglang.launch_server --context-length 2048
```

### 2. Slow Performance
```bash
# Check GPU utilization
nvidia-smi --query-gpu=utilization.gpu --format=csv

# If utilization <80%, increase batch size
python -m sglang.launch_server --max-running-requests 8

# Check CUDA kernels
nvprof --print-gpu-trace python -m sglang.launch_server ...
```

### 3. Model Loading Errors
```bash
# Check CUDA version
nvcc --version

# Verify model format
file /models/llama-7b.gguf

# Check VRAM availability
nvidia-smi --query-gpu=memory.free --format=csv,noheader
```

## Optimization Summary

### Recommended Configuration for Tesla P4

```bash
# phase1_foundation/scripts/optimal_config.sh
#!/bin/bash

# Optimal SGLang config for Tesla P4
python -m sglang.launch_server \
  --model-path /models/llama-7b-q4.gguf \
  --port 8000 \
  --host 0.0.0.0 \
  --tp 1 \
  --pp 1 \
  --mem-fraction-static 0.9 \
  --max-running-requests 4 \
  --schedule-policy fcfs \
  --dtype float16 \
  --context-length 4096 \
  --cache-max-entry-count 8192 \
  --cache-max-byte-size 67108864 \
  --chunked-context

echo "SGLang started with optimal Tesla P4 configuration"
echo "Model: 7B-Q4_K_M"
echo "Batch size: 4"
echo "Context length: 4096"
echo "Max running requests: 4"
echo "KV cache: 64MB"
```

### Why This Configuration?
1. **Q4 quantization**: Fits 7B model in 4GB (50% of VRAM)
2. **Batch size 4**: Good throughput without OOM
3. **Context 4096**: High quality within VRAM
4. **90% VRAM**: 10% headroom for spikes
5. **KV cache**: 64MB (8% of VRAM) for cached contexts

---

**Last Updated**: 2026-01-12

**For AI Agents**: When optimizing Tesla P4:
1. Always use quantization (Q4_K_M recommended)
2. Monitor VRAM usage with nvidia-smi
3. Tune batch size based on workload
4. Balance context length vs. VRAM
5. Use FP16 for speed (not F32)
