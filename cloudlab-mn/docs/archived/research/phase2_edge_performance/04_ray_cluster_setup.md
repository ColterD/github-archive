# 04: Ray Cluster Setup

> **Prerequisites**: Python 3.9+, 4+ GB RAM per node
> **Estimated Time**: 20 minutes
> **Difficulty**: Intermediate

---

## Overview

This guide covers setting up a Ray cluster for distributed cognitive computing:

- Distributed actor model for cognitive modules
- Automatic scaling and resource management
- Fault tolerance with automatic recovery
- GPU scheduling for inference tasks

---

## Why Ray?

| Feature | Traditional (multiprocessing) | Ray |
|---------|-------------------------------|-----|
| **Distributed** | No (single machine) | Yes (multi-machine) |
| **Fault tolerance** | No | Yes (automatic retry) |
| **GPU scheduling** | Manual | Automatic |
| **Actor model** | No (process only) | Yes |
| **Scaling** | Manual | Automatic |

---

## Installation

### Head Node Setup

```bash
# Install Ray with default dependencies
pip install ray[default]==2.9.0

# For GPU support
pip install ray[rllib]==2.9.0

# Verify
python -c "import ray; print(ray.__version__)"
# Expected: 2.9.0
```

### Worker Node Setup

```bash
# Install Ray on each worker
pip install ray[default]==2.9.0

# Start Ray worker
ray start --address=<HEAD_NODE_IP>:6379
```

---

## Ray Configuration

### NixOS Configuration

```nix
# configuration.nix
{ config, pkgs, ... }:
{
  services.ray = {
    enable = true;
    dashboardPort = 8265;
    redisPort = 6379;
    nodeManagerPort = 6378;
    objectManagerPort = 6379;
  };

  # Python packages
  environment.systemPackages = with pkgs; [
    (python3.withPackages (ps: with ps; [ ray pip ]))
  ];
}
```

---

## Starting Ray Cluster

### Head Node

```bash
# Start Ray head node
ray start --head --port=6379 --dashboard-port=8265 --dashboard-host=0.0.0.0

# Expected output:
# Ray runtime started.
# Dashboard URL: http://localhost:8265
```

### Worker Nodes

```bash
# Connect to head node
ray start --address=<HEAD_IP>:6379 --num-cpus=16 --num-gpus=1

# Verify
ray status
```

---

## Ray Actors for Cognitive Modules

### Neurotransmitter Actor

```python
# ray_neurotransmitters.py
import ray
import numpy as np
from dataclasses import dataclass

@ray.remote
class NeurotransmitterActor:
    """Distributed neurotransmitter state management."""
    
    def __init__(self):
        self.state = {
            "dopamine": 0.5,
            "serotonin": 0.5,
            "oxytocin": 0.5,
            "cortisol": 0.5,
            "norepinephrine": 0.5
        }
    
    def apply_delta(self, delta: dict) -> dict:
        """Apply opponent-process effects."""
        for key, value in delta.items():
            if key in self.state:
                self.state[key] = np.clip(self.state[key] + value, 0.0, 1.0)
        
        # Opponent rebound
        if self.state["dopamine"] > 0.8:
            self.state["norepinephrine"] = min(1.0, self.state["norepinephrine"] + 0.1)
        
        return self.state.copy()
    
    def get_state(self) -> dict:
        return self.state.copy()

# Usage
ray.init()
neuro_actor = NeurotransmitterActor.remote()

# Apply consequence
delta = {"dopamine": 0.2, "cortisol": -0.1}
state = ray.get(neuro_actor.apply_delta.remote(delta))
print(f"State: {state}")
```

### Global Workspace Actor

```python
@ray.remote(num_cpus=2)
class GlobalWorkspaceActor:
    """Distributed global workspace implementation."""
    
    def __init__(self, capacity: int = 7):
        self.capacity = capacity
        self.buffer = ray.data.range(0).limit(0)
        self.salience_threshold = 0.6
    
    def broadcast(self, inputs: list[dict]) -> dict:
        """Select and broadcast highest-salience signals."""
        # Calculate salience (simplified)
        scored = [(self._calculate_salience(i), i) for i in inputs]
        scored.sort(reverse=True, key=lambda x: x[0])
        
        # Select top signals
        selected = [item for score, item in scored if score > self.salience_threshold]
        selected = selected[:self.capacity]
        
        return {"broadcast": selected, "salience_max": scored[0][0] if scored else 0}
    
    def _calculate_salience(self, input_data: dict) -> float:
        """Calculate salience based on neurotransmitter state."""
        # In production, this would query NeurotransmitterActor
        return np.random.uniform(0.3, 1.0)  # Simplified
```

### Inference Engine Actor (with GPU)

```python
@ray.remote(num_gpus=1)
class InferenceEngineActor:
    """Distributed inference engine with GPU acceleration."""
    
    def __init__(self, model_path: str):
        self.model_path = model_path
        # Load model (simplified)
        self.model = None
    
    def compute_free_energy(self, state: dict, policy: str) -> float:
        """Compute expected free energy for a policy."""
        # Simulate GPU inference
        risk = self._calculate_risk(state, policy)
        ambiguity = self._calculate_ambiguity(state, policy)
        return risk + ambiguity
    
    def _calculate_risk(self, state: dict, policy: str) -> float:
        """Divergence from priorities."""
        return 0.5  # Simplified
    
    def _calculate_ambiguity(self, state: dict, policy: str) -> float:
        """Epistemic value."""
        return 0.3  # Simplified
```

---

## Distributed Cognitive Pipeline

```python
# distributed_cognitive_pipeline.py
import ray
from ray_neurotransmitters import NeurotransmitterActor
from ray_global_workspace import GlobalWorkspaceActor
from ray_inference import InferenceEngineActor

def run_distributed_inference(input_data: dict):
    """Run full cognitive pipeline across Ray cluster."""
    
    # Initialize actors
    neuro = NeurotransmitterActor.remote()
    workspace = GlobalWorkspaceActor.remote(capacity=7)
    inference = InferenceEngineActor.remote(model_path="model.pkl")
    
    # Step 1: Get current neurotransmitter state
    state = ray.get(neuro.get_state.remote())
    
    # Step 2: Broadcast input to workspace
    broadcast_result = ray.get(workspace.broadcast([input_data]))
    
    # Step 3: Compute free energy for policies
    free_energy = ray.get(inference.compute_free_energy.remote(state, "policy_1"))
    
    # Step 4: Apply consequence
    delta = {"dopamine": 0.1, "cortisol": -0.05}
    new_state = ray.get(neuro.apply_delta.remote(delta))
    
    return {
        "broadcast": broadcast_result,
        "free_energy": free_energy,
        "new_state": new_state
    }
```

---

## Resource Management

### CPU Scheduling

```python
# Reserve CPUs for specific actors
@ray.remote(num_cpus=4)
class HeavyComputationActor:
    pass

# Dynamic resource allocation
@ray.remote
class FlexibleActor:
    pass
```

### GPU Scheduling

```python
# Reserve GPU for inference
@ray.remote(num_gpus=1)
class GPUInferenceActor:
    pass

# Multiple GPUs
@ray.remote(num_gpus=2)
class MultiGPUActor:
    pass

# Verify GPU allocation
@ray.remote(num_gpus=1)
def gpu_check():
    import torch
    return torch.cuda.device_count()
```

---

## Fault Tolerance

```python
# Enable automatic retries
@ray.remote(max_retries=3)
class FaultTolerantActor:
    def process(self, data):
        # Automatically retry on failure
        return self._computation(data)
```

---

## Performance Tuning

### Object Store Configuration

```bash
# Increase object store size
ray start --head --object-store-memory=128000000000  # 128GB
```

### Batch Processing

```python
# Use Ray Dataset for large data
ds = ray.data.read_parquet("cognitive_data/*.parquet")
ds.map_batches(lambda batch: process_batch(batch), num_gpus=1)
```

---

## Monitoring

### Ray Dashboard

Access dashboard at: `http://<HEAD_NODE>:8265`

Monitor:
- Actor utilization
- CPU/GPU usage
- Memory consumption
- Task scheduling

### CLI Monitoring

```bash
# Ray status
ray status

# Check specific actor
ray list actors
```

---

## Benchmarks

| Metric | Single Machine | Ra
