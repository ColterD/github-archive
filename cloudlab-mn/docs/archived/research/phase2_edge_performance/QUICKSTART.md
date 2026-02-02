# Phase 2: Quick Start Guide

> **Time to first run**: 15 minutes
> **Prerequisites**: Phase 1 complete, NixOS installed

---

## 1-Minute Overview

Phase 2 adds:
- **WasmEdge** for secure, fast cognitive module execution
- **QUIC/HTTP3** for ultra-low-latency communication (<5ms)
- **Ray** for distributed computing across edge nodes
- **Performance tuning** (BBR, GPU optimization)

---

## 5-Minute Setup

```bash
# 1. Install WasmEdge
curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install.sh | bash
source $HOME/.wasmedge/env

# 2. Install Ray
pip install ray[default]==2.9.0

# 3. Enable BBR
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
sudo sysctl -w net.core.default_qdisc=fq

# 4. Verify
wasmedge --version    # WasmEdge 0.13.x
ray --version         # 2.9.0
sysctl net.ipv4.tcp_congestion_control  # bbr
```

---

## 10-Minute Test Run

```bash
# 1. Run WasmEdge benchmark
cd benchmarks
python3 wasm_latency_benchmark.py

# 2. Run Ray performance test
python3 ray_performance_test.py

# 3. Run QUIC throughput test
./quic_throughput_test.sh
```

---

## Next Steps

| Goal | Read This |
|------|-----------|
| Deploy cognitive modules to WasmEdge | [01_webassembly_deployment.md](./01_webassembly_deployment.md) |
| Set up QUIC/HTTP3 communication | [02_quic_http3_setup.md](./02_quic_http3_setup.md) |
| Create Ray cluster for distributed computing | [04_ray_cluster_setup.md](./04_ray_cluster_setup.md) |
| Optimize performance (BBR, GPU) | [05_performance_tuning.md](./05_performance_tuning.md) |
| Step-by-step deployment | [runbook_wasm_deployment.md](./runbook_wasm_deployment.md) |
| Troubleshoot issues | [troubleshooting_edge_performance.md](./troubleshooting_edge_performance.md) |

---

## Example Configurations

- `example_deployments/wasm_edge_config.nix` - NixOS WasmEdge setup
- `example_deployments/bbr_tuning.nix` - BBR congestion control
- `example_deployments/ray_cluster.yaml` - Ray cluster config
- `example_deployments/quic_zenoh_bridge.py` - QUIC+Zenoh bridge

---

## Expected Performance

| Metric | Target | Hardware |
|--------|--------|----------|
| Cognitive inference | < 20ms | WasmEdge AOT |
| Inter-node communication | < 5ms | QUIC+BBR |
| Cold start | < 100ms | WasmEdge |
| Throughput | 10K+ msg/s | Ray cluster |
| GPU utilization | 70-80% | Tesla P4 |

---

## Need Help?

- [Troubleshooting](./troubleshooting_edge_performance.md) - Common issues
- [Runbook](./runbook_wasm_deployment.md) - Step-by-step deployment
- [README](./README.md) - Full documentation

---

**Start here**: [01_webassembly_deployment.md](./01_webassembly_deployment.md)
