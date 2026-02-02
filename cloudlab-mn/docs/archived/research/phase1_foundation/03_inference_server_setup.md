# Inference Server Setup: SGLang (Tesla P4 Compatible)

**Component**: Phase 1.3 - Inference Server
**Duration**: Weeks 2-3 (16 hours)
**Priority**: P0 - Critical for policy generation
**Platform**: CloudLab c220g5

---

## Critical Hardware Compatibility Correction

### Tesla P4 GPU Incompatibility with vLLM

| Inference Framework | Tesla P4 Support | Reason |
|-------------------|------------------|---------|
| **vLLM** | ❌ **NO** | Requires compute capability 7.0+ (Volta/Turing) |
| **SGLang** | ✅ **YES** | Supports Pascal architecture (6.1) |
| **llama.cpp** | ✅ **YES** | CPU+GPU hybrid fallback |

### Why SGLang Over vLLM?

1. **Hardware Compatibility**: Tesla P4 (Pascal, GP104) lacks tensor cores required by vLLM's PagedAttention
2. **Quantization Support**: SGLang supports AWQ (4-bit) to fit models in 8GB VRAM
3. **Structured Generation**: Better for policy generation (Active Inference requires JSON outputs)
4. **Multi-LoRA Serving**: Future-proof for specialized agents

---

## Prerequisites

### Hardware Requirements

| Component | Requirement | CloudLab Status |
|-----------|---------------|-----------------|
| **GPU** | Tesla P4 (8GB GDDR5) | ✅ Available |
| **CUDA** | 11.8+ | ✅ Install |
| **RAM** | 32GB+ | ✅ 128GB available |
| **CPU** | 4 cores+ | ✅ 28 cores available |

### Software Requirements

```nix
# /etc/nixos/configuration.nix
{
  environment.systemPackages = with pkgs; [
    cudaPackages_12.cudatoolkit  # CUDA 12
    python312Packages.pytorch      # PyTorch with CUDA
    python312Packages.sglang      # SGLang
  ];
  
  # CUDA environment
  environment.sessionVariables = {
    CUDA_HOME = "${pkgs.cudaPackages_12.cudatoolkit}";
    LD_LIBRARY_PATH = "${pkgs.cudaPackages_12.cudatoolkit}/lib";
  };
}
```

---

## Part 1: SGLang Installation

### Step 1: Install SGLang via pip

```bash
# Create virtual environment
python3.12 -m venv venv/sglang
source venv/sglang/bin/activate

# Install SGLang
pip install sglang[all]  # Install all dependencies

# Verify installation
python -c "import sglang; print(sglang.__version__)"
```

### Step 2: Download Quantized Model

Tesla P4 has 8GB VRAM. Use AWQ (4-bit) quantized Phi-3-mini.

```bash
# Download AWQ-quantized Phi-3-mini-4k-instruct
cd models
wget https://huggingface.co/ModelCloud/Phi-3-mini-4k-instruct-awq/resolve/main/phi-3-mini-4k-instruct-awq.onnx

# Alternatively, use huggingface-cli
pip install huggingface-hub
huggingface-cli download \
    ModelCloud/Phi-3-mini-4k-instruct-awq \
    --local-dir models/phi-3-mini-4k-instruct-awq
```

### Step 3: Initialize SGLang Runtime

```python
# src/cognition/inference/sglang_runtime.py
from sglang import Runtime
import torch

def create_inference_runtime():
    """Initialize SGLang runtime for Tesla P4"""
    
    # Check GPU
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA not available")
    
    gpu_name = torch.cuda.get_device_name(0)
    print(f"GPU detected: {gpu_name}")
    
    # Initialize SGLang
    runtime = Runtime(
        model_path="models/phi-3-mini-4k-instruct-awq",
        tp=1,  # Tesla P4 (single GPU)
        quantization="awq",  # 4-bit quantization
        max_model_len=2048,  # Reduced from 4096 due to 8GB VRAM
        gpu_memory_utilization=0.85,  # Conservative 85% to avoid OOM
        trust_remote_code=True
    )
    
    return runtime

# Create runtime (load once, reuse)
inference_runtime = create_inference_runtime()
```

---

## Part 2: Active Inference Integration

### Step 1: Expected Free Energy Calculation

```python
# src/cognition/inference/active_inference.py
import numpy as np
from typing import Dict, List

def calculate_expected_free_energy(
    current_state: Dict,
    policy: Dict,
    internal_state: Dict
) -> float:
    """
    Calculate Expected Free Energy G(π)
    
    G(π) ≈ Risk + Ambiguity
    
    Where:
    - Risk = Divergence from homeostatic target
    - Ambiguity = Information gain (entropy)
    """
    
    # Risk: Divergence from dopamine target
    dopamine_target = 0.5  # Normalized
    dopamine_current = internal_state["dopamine"]
    risk = np.abs(dopamine_current - dopamine_target)
    
    # Ambiguity: Entropy of action distribution
    action_probs = np.array(policy["action_probabilities"])
    ambiguity = -np.sum(action_probs * np.log(action_probs + 1e-10))
    
    # Total EFE
    efe = risk + ambiguity
    
    return efe

def select_policy_minimizing_efe(
    policies: List[Dict],
    internal_state: Dict
) -> Dict:
    """Select policy π that minimizes Expected Free Energy"""
    
    # Calculate EFE for each policy
    policies_with_efe = []
    for policy in policies:
        efe = calculate_expected_free_energy(
            current_state=policy["state"],
            policy=policy,
            internal_state=internal_state
        )
        policy["efe"] = efe
        policies_with_efe.append(policy)
    
    # Sort by EFE (ascending - minimize)
    policies_with_efe.sort(key=lambda x: x["efe"])
    
    # Select best policy
    best_policy = policies_with_efe[0]
    
    return best_policy
```

### Step 2: SGLang Integration for Policy Generation

```python
# src/cognition/inference/policy_generator.py
from sglang import Runtime
from typing import Dict

class PolicyGenerator:
    def __init__(self, runtime: Runtime):
        self.runtime = runtime
    
    def generate_policy(
        self,
        sensory_state: Dict,
        workspace_contents: List[Dict],
        neurotransmitters: Dict
    ) -> Dict:
        """
        Generate policy using SGLang (structured JSON output)
        """
        
        # Construct prompt for Active Inference
        prompt = f"""You are the Inference Engine of Emily Sovereign V4.
        Your goal is to select a policy π that minimizes Expected Free Energy G(π).

        Current State:
        - Sensory Input: {sensory_state}
        - Workspace Contents: {workspace_contents}
        - Neurotransmitters:
            * Dopamine: {neurotransmitters['dopamine']}
            * Serotonin: {neurotransmitters['serotonin']}
            * Cortisol: {neurotransmitters['cortisol']}

        Calculate G(π) ≈ Risk + Ambiguity for each candidate policy:
        - Risk = Divergence from dopamine target (0.5)
        - Ambiguity = Information entropy

        Respond with JSON:
        {{
            "policy": {{
                "action": "<action>",
                "rationale": "<why this action>",
                "expected_efe": <calculated EFE>,
                "risk": <risk component>,
                "ambiguity": <ambiguity component>
            }}
        }}
        """
        
        # Generate with structured output
        result = self.runtime.generate(
            prompt,
            temperature=0.3,  # Lower temperature for consistent EFE calculation
            max_new_tokens=512,
            stop=["\n\n", "```"]  # Stop at next section
        )
        
        # Parse JSON response
        import json
        policy = json.loads(result["text"])
        
        return policy["policy"]

# Initialize policy generator
policy_generator = PolicyGenerator(inference_runtime)
```

---

## Part 3: OpenAI-Compatible API

### Step 1: Deploy SGLang as API Server

```bash
# Start SGLang API server
sglang launch \
    --model-path models/phi-3-mini-4k-instruct-awq \
    --tp 1 \
    --quantization awq \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 2048 \
    --api-keys-file /etc/sglang/api_keys.txt
```

### Step 2: Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/sglang
upstream sglang {
    server localhost:8000;
}

server {
    listen 80;
    server_name inference.cloudlab.internal;

    location /v1/ {
        proxy_pass http://sglang/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Chunked transfer for streaming
        proxy_buffering off;
    }
}
```

### Step 3: Test OpenAI Compatibility

```python
# test_sglang_api.py
from openai import OpenAI

# Use SGLang as OpenAI-compatible API
client = OpenAI(
    base_url="http://inference.cloudlab.internal/v1",
 
