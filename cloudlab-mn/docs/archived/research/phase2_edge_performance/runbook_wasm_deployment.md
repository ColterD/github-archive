# Runbook: WASM Deployment

> **Purpose**: Step-by-step deployment of cognitive modules to WasmEdge
> **Duration**: 45 minutes
> **Prerequisites**: Phase 1 complete, NixOS installed

---

## Checklist

Before starting, verify:

- [ ] NixOS 24.05+ installed
- [ ] Python 3.11+ available
- [ ] Docker/Podman installed
- [ ] 4GB+ free RAM
- [ ] Root access (for kernel tuning)

---

## Step 1: Install WasmEdge (5 minutes)

### 1.1 Install WasmEdge Runtime

```bash
# Download and install WasmEdge
curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install.sh | bash

# Add to PATH
source $HOME/.wasmedge/env

# Verify installation
wasmedge --version
# Expected: WasmEdge 0.13.x
```

### 1.2 Install Python Plugin

```bash
# Install Python 3.11 for WasmEdge
wasmedge-py install 3.11.5

# Verify
wasmedge-python --version
# Expected: Python 3.11.5
```

---

## Step 2: Prepare Cognitive Modules (10 minutes)

### 2.1 Copy Source Code

```bash
# Create build directory
mkdir -p wasm_build/cognitive
cd wasm_build

# Copy Emily Sovereign V4 modules
cp -r ../../Emily_Sovereign_V4/src/cognition/* cognitive/

# List modules
ls -la cognitive/
# Expected: agency.py, logic/, etc.
```

### 2.2 Simplify Modules for WASM

WASM has limitations. Review modules and:

- Remove multiprocessing calls
- Remove unsupported libraries (PyTorch, TensorFlow)
- Replace threading with asyncio
- Add type hints for WasmEdge compatibility

### 2.3 Test Native Execution

```bash
# Test modules work with Python 3.11
cd cognitive
python3 agency.py

# Expected: No errors, cognitive core initializes
```

---

## Step 3: Compile to WASM (10 minutes)

### 3.1 Compile Main Module

```bash
cd wasm_build

# Compile cognitive core
wasmedge-python -m py_compile cognitive/agency.py

# Verify .pyc generated
ls -la cognitive/__pycache__/
```

### 3.2 Package with Dependencies

```bash
# Package with WasmEdge tools
wasmedge-tools package \
    --input cognitive/agency.py \
    --output cognitive_core.wasm \
    --python-version 3.11

# Verify WASM file
file cognitive_core.wasm
# Expected: WebAssembly (wasm) binary
```

### 3.3 Add Dependencies

```bash
# Add NumPy support
wasmedge-tensorflow-plugin install

# Add WASI-socket for networking
wasmedge-plugin-wasi-socket install
```

---

## Step 4: Create Docker Image (5 minutes)

### 4.1 Create Dockerfile

```bash
cat > Dockerfile << 'EOF'
FROM ghcr.io/wasmedge/wasmedge:0.13.5-full

# Copy WASM modules
COPY cognitive_core.wasm /app/
COPY cognitive/ /app/cognitive/

# Set working directory
WORKDIR /app

# Set entrypoint
ENTRYPOINT ["wasmedge", "--dir", "/app", "/app/cognitive_core.wasm"]
EOF
```

### 4.2 Build Image

```bash
# Build image
docker build -t emily-cognitive-wasm:latest .

# Verify image
docker images | grep emily-cognitive-wasm
```

---

## Step 5: Test WasmEdge Execution (5 minutes)

### 5.1 Run with WasmEdge Direct

```bash
# Run WASM file
wasmedge --dir . cognitive_core.wasm

# Expected output:
# Initializing Neurotransmitters...
# Dopamine: 0.5, Serotonin: 0.5, ...
```

### 5.2 Run with Docker

```bash
# Run Docker container
docker run --rm -it emily-cognitive-wasm:latest

# Expected: Same output as above
```

---

## Step 6: Integrate with Ray (5 minutes)

### 6.1 Create Ray Actor

```bash
cat > ray_wasm_actor.py << 'EOF'
import ray
import subprocess
from pathlib import Path

@ray.remote
class CognitiveWasmActor:
    def __init__(self, wasm_path: str):
        self.wasm_path = wasm_path
    
    def inference(self, state: dict) -> dict:
        result = subprocess.run(
            ["wasmedge", self.wasm_path],
            capture_output=True,
            text=True,
            timeout=1
        )
        return {"state": state, "output": result.stdout}

# Usage
ray.init()
actor = CognitiveWasmActor.remote("cognitive_core.wasm")
result = ray.get(actor.inference.remote({"dopamine": 0.7}))
print(result)
EOF
```

### 6.2 Test Ray Integration

```bash
# Start Ray
ray start --head

# Run actor test
python3 ray_wasm_actor.py

# Expected: Successful inference result
```

---

## Step 7: Deploy to Production (5 minutes)

### 7.1 Push to Registry

```bash
# Tag image
docker tag emily-cognitive-wasm:latest registry.example.com/emily-cognitive-wasm:latest

# Push to registry
docker push registry.example.com/emily-cognitive-wasm:latest
```

### 7.2 Deploy with Kubernetes (Optional)

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: emily-cognitive-wasm
spec:
  replicas: 3
  selector:
    matchLabels:
      app: emily-cognitive
  template:
    metadata:
      labels:
        app: emily-cognitive
    spec:
      containers:
      - name: cognitive
        image: registry.example.com/emily-cognitive-wasm:latest
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

```bash
# Deploy to Kubernetes
kubectl apply -f k8s-deployment.yaml

# Verify
kubectl get pods -l app=emily-cognitive
```

---

## Verification

### 7.3 Verify Deployment

```bash
# Check container status
docker ps | grep emily-cognitive-wasm

# Check logs
docker logs $(docker ps -q | grep emily-cognitive-wasm)

# Test endpoint
curl http://localhost:8080/health
# Expected: {"status": "healthy"}
```

---

## Troubleshooting

### Issue: WASM file not found

**Symptom**: `Error: Cannot open file`

**Solution**:
```bash
# Verify file exists
ls -la cognitive_core.wasm

# Check path in Dockerfile
WORKDIR /app  # Must match COPY destination
```

### Issue: NumPy import error

**Symptom**: `ModuleNotFoundError: No module named 'numpy'`

**Solution**:
```bash
# Install WASI-NumPy
wasmedge-tensorflow-plugin install

# Or use prebuilt NumPy
wget https://github.com/WasmEdge/wasmedge-redis/releases/download/.../numpy.wasm
```

### Issue: Ray actor timeout

**Symptom**: `TaskTimeoutError`

**Solution**:
```python
# Increase timeout
result = ray.get(actor.inference.remote(state), timeout=5.0)

# Or use async pattern
result_ref = actor.inference.remote(state)
result = ray.get(result_ref, timeout=5.0)
```

---

## Rollback Procedure

If deployment fails:

```bash
# Stop containers
docker stop $(docker ps -q | grep emily-cognitive-wasm)

# Remove images
docker rmi emily-cognitive-wasm:latest

# Restore previous version
docker pull registry.example.com/emily-cognitive-wasm:stable
docker run -d registry.example.com/emily-cognitive-wasm:stable
```

---

## Completion Checklist

- [ ] WasmEdge installed and verified
- [ ] Cognitive modules compiled to WASM
- [ ] Docker image built and tested
- [ ] Ray integration verified
- [ ] Production deployment complete
- [ ] Health checks passing
- [ ] Monitoring configured

---

## Next Steps

- [02: QUIC/HTTP3 Setup](./02_quic_http3_setup.md) - Set up low-latency communication
- [04: Ray Cluster Setup](./04_ray_cluster_setup.md) - Scale to multiple nodes
- [troubleshooting_edge_performance.md](./troubleshooting_edge_performance.md) - Common issues
