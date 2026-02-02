# Observability Setup: Cilium eBPF, Hubble, Langfuse

**Component**: Phase 1.1 - Observability Stack
**Duration**: Week 1 (8 hours)
**Priority**: P0 - Critical for debugging
**Platform**: CloudLab c220g5

---

## Overview

Deploy comprehensive observability infrastructure using:
- **Cilium**: eBPF-based networking and security
- **Hubble**: Real-time network flow visualization
- **Langfuse**: LLM tracing and evaluation

---

## Prerequisites

### Hardware Requirements

| Component | Requirement | CloudLab Status |
|-----------|---------------|-----------------|
| **Linux Kernel** | 5.10+ (Cilium requires) | ✅ Verify NixOS kernel version |
| **eBPF Support** | /sys/kernel/debug/tracing available | ✅ Modern Linux |
| **RAM** | 4GB minimum | ✅ 128GB available |
| **CPU** | 2 cores minimum | ✅ 28 cores available |

---

## Part 1: Cilium Deployment

### Step 1: Verify Kernel Version

**CRITICAL**: Cilium requires Linux kernel 5.10+ for full eBPF feature support.

```bash
# Check current kernel version
uname -r
# Expected: >= 5.15 (NixOS Unstable)
```

**NixOS Kernel Configuration**:

```nix
# /etc/nixos/configuration.nix
{
  boot.kernelPackages = pkgs.linuxPackages_6_6;  # Cilium compatible
  boot.kernel.sysctl = {
    "net.core.bpf_jit_enable" = true;  # Enable BPF JIT
  };
}
```

### Step 2: Install Cilium

```bash
# Download Cilium CLI
curl -L --remote-name-all https://raw.githubusercontent.com/cilium/cilium-cli/main/stable/install.sh
chmod +x install.sh
sudo ./install.sh
```

### Step 3: Deploy Cilium (Standalone Mode)

```bash
# Initialize Cilium (standalone mode)
cilium install \
  --version 1.18.5 \
  --set cluster.name=emily-sovereign \
  --set tunnel=disabled \
  --set nativeRoutingCIDR=10.0.0.0/16
```

### Step 4: Enable Hubble

```bash
# Enable Hubble observability
cilium hubble enable

# Deploy Hubble UI
cilium hubble ui

# Access at: http://localhost:12000
```

### Step 5: Configure eBPF Tracing for Zenoh

Create `cilium-tracing-policy.yaml` to monitor Zenoh traffic (port 7447).

```yaml
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: zenoh-traffic
spec:
  kprobes:
    - call: "tcp_sendmsg"
      selectors:
        - matchArgs:
            - index: 0
              operator: "Equal"
              values: ["7447"]  # Zenoh port
```

Apply with `kubectl apply -f cilium-tracing-policy.yaml`.

---

## Part 2: Langfuse Deployment

### Docker Compose Configuration

Create `docker-compose.langfuse.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=langfuse
      - POSTGRES_PASSWORD=langfuse_password
      - POSTGRES_DB=langfuse
    volumes:
      - langfuse-postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  langfuse:
    image: langfuse/langfuse:latest
    environment:
      - DATABASE_URL=postgresql://langfuse:langfuse_password@postgres:5432/langfuse
      - NEXTAUTH_SECRET=your_secret_key
    ports:
      - "3000:3000"  # Web UI
      - "4318:4318"  # OTLP endpoint
    depends_on:
      - postgres
```

Deploy:

```bash
docker-compose -f docker-compose.langfuse.yml up -d
```

### Integration with Python

```python
from langfuse import Langfuse

langfuse = Langfuse(
    public_key="pk-...",
    secret_key="sk-...",
    host="http://langfuse.cloudlab.internal"
)

# Trace execution
with langfuse.trace(name="triune_crew") as trace:
    trace.span(name="inference")
```

---

## Verification

```bash
# Check Cilium
cilium status

# Check Hubble
cilium hubble status

# Check Langfuse
curl http://langfuse.cloudlab.internal/health
```

---

## Troubleshooting

### Cilium Kernel Incompatibility

If kernel < 5.10:

```bash
# Upgrade to NixOS unstable channel
sudo nix-channel --add https://nixos.org/channels/nixos-unstable nixos
sudo nixos-rebuild switch --upgrade
```

### Hubble No Flows

Enable flow recording:

```bash
cilium hubble enable --live
```

---

## Sources

- Cilium: https://docs.cilium.io/
- Langfuse: https://langfuse.com/docs/

