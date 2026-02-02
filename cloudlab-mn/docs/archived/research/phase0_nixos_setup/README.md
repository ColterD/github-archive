# Phase 0: NixOS Server Setup with AI Agent Assistance

## Overview

**Phase 0** establishes the foundational infrastructure for all subsequent phases. This comprehensive guide walks you through setting up a production-ready NixOS server on CloudLab's c220g5 hardware, configured with AI agent assistance capabilities.

**Time Investment**: 4-6 hours for complete setup (including AI agent integration)

**Complexity**: Advanced (requires Linux system administration knowledge)

## Quick Start

```bash
# 1. Hardware verification (15 min)
cd phase0_nixos_setup
./verify-hardware.sh

# 2. Installation (2-3 hours)
nixos-generate-config --root /mnt
cp configuration.nix /mnt/etc/nixos/configuration.nix
nixos-install

# 3. Post-install configuration (1-2 hours)
sudo nixos-rebuild switch

# 4. AI agent setup (30 min)
curl -fsSL https://example.com/ai-agent-setup | sudo bash
```

For the fastest path to a working system, see [runbook_quickstart.md](runbook_quickstart.md).

## Table of Contents

### Core Documentation

| Document | Purpose | Time Required |
|----------|---------|---------------|
| [00_prerequisites.md](00_prerequisites.md) | Pre-setup requirements and preparations | 30 min |
| [01_hardware_checklist.md](01_hardware_checklist.md) | CloudLab c220g5 verification and optimization | 15 min |
| [02_nixos_installation.md](02_nixos_installation.md) | Complete NixOS installation procedure | 2-3 hours |
| [03_network_configuration.md](03_network_configuration.md) | Networking, VLANs, WireGuard VPN, BBR | 45 min |
| [04_storage_setup.md](04_storage_setup.md) | ZFS pool with RAIDZ2 and special VDEV | 1 hour |
| [05_security_hardening.md](05_security_hardening.md) | Firewall, SSH hardening, SELinux | 30 min |
| [06_monitoring_setup.md](06_monitoring_setup.md) | Prometheus, Grafana, Alertmanager | 45 min |
| [07_developer_tools.md](07_developer_tools.md) | Nix, Git, Docker, Python environment | 30 min |

### Reference Materials

| Document | Purpose |
|----------|---------|
| [example_configuration.nix](example_configuration.nix) | Complete working NixOS configuration |
| [runbook_quickstart.md](runbook_quickstart.md) | 1-hour quick start runbook |
| [troubleshooting_guide.md](troubleshooting_guide.md) | Common issues and solutions |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Phase 0 Infrastructure                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Hardware: CloudLab c220g5                            │  │
│  │  • 2× Intel Xeon E5-2650 v4 (24 cores total)          │  │
│  │  • 256 GB DDR4 ECC RAM                                │  │
│  │  • 4× 1.92 TB NVMe SSD                                │  │
│  │  • 2× 10GbE Mellanox NICs                             │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  NixOS 24.11 (Stable)                                  │  │
│  │  • Declarative configuration                          │  │
│  │  • Atomic rollbacks                                   │  │
│  │  • Reproducible builds                                │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Storage: ZFS RAIDZ2 + Special VDEV                    │  │
│  │  • 4× 1.92 TB NVMe (raw)                               │  │
│  │  • Compression: lz4                                    │  │
│  │  • Deduplication: disabled (for performance)          │  │
│  │  • ARC cache: 32 GB                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Network Stack                                         │  │
│  │  • VLAN segmentation (management, data, AI)             │  │
│  │  • WireGuard VPN (point-to-site)                       │  │
│  │  • BBR TCP congestion control                          │  │
│  │  • 10GbE LACP bonding                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Services Layer                                        │  │
│  │  • SSH (hardened, key-only auth)                      │  │
│  │  • Docker container runtime                            │  │
│  │  • Prometheus + Grafana monitoring                     │  │
│  │  • AI agent orchestration interface                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  AI Agent Support                                      │  │
│  │  • Nix shell for reproducible environments             │  │
│  │  • Python 3.11 + Poetry for ML/AI workloads            │  │
│  │  • GPU pass-through ready (future phases)             │  │
│  │  • API endpoint for agent commands                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## AI Agent Integration

This infrastructure is designed to work seamlessly with AI agents. Key integration points:

### What AI Agents Can Do
- Configuration Management: Declarative NixOS configurations are machine-readable
- Service Health Monitoring: Prometheus metrics expose all system state
- Automated Rollbacks: Atomic rollbacks enable safe experimentation
- Log Analysis: Structured logs enable AI-driven anomaly detection

### What Requires Human Intervention
- Initial hardware configuration (BIOS, RAID controller)
- Network connectivity setup (first SSH access)
- Secret management (SSH keys, API tokens)
- Physical access (hardware swaps)
- Emergency recovery (if system becomes inaccessible)

## Hardware Specifications: CloudLab c220g5

### CPU
- **Model**: 2× Intel Xeon E5-2650 v4 (Broadwell-EP)
- **Cores/Threads**: 24 cores / 48 threads total
- **Clock Speed**: 2.2 GHz base, 2.9 GHz turbo
- **Architecture**: x86_64
- **Virtualization**: VT-x, VT-d (IOMMU)

### Memory
- **Capacity**: 256 GB DDR4 ECC RAM
- **Type**: DDR4-2400 ECC Registered
- **Configuration**: 8× 32 GB DIMMs

### Storage
- **Boot Drives**: 4× 1.92 TB NVMe SSDs
- **Interface**: PCIe 3.0 x4
- **Sequential Read**: Up to 3,000 MB/s per drive

### Network
- **NICs**: 2× Mellanox ConnectX-4 Lx (10GbE)
- **Ports**: 4× SFP+ ports total
- **Offload**: RDMA (RoCE v2), TCP/IP

## Key Features

1. **Declarative Infrastructure**: Everything is code
2. **Atomic Updates & Rollbacks**: Never break your system
3. **ZFS Data Protection**: Enterprise-grade storage
4. **Network Isolation**: VLANs for security
5. **Comprehensive Monitoring**: Know everything

## Prerequisites

- CloudLab account with c220g5 node allocation
- Network details (IP, gateway, DNS)
- SSH client
- 4-6 uninterrupted hours

See [00_prerequisites.md](00_prerequisites.md) for details.

## Learning Resources

- [NixOS Manual](https://nixos.org/manual/nixos/stable/)
- [OpenZFS Documentation](https://openzfs.github.io/openzfs-docs/)
- [WireGuard](https://www.wireguard.com/)
- [Prometheus](https://prometheus.io/docs/)

## Next Steps

After Phase 0, proceed to:
- Phase 1: Container Orchestration
- Phase 2: AI/ML Infrastructure
- Phase 3: Data Pipeline
- Phase 4: Application Deployment

---

**Version**: 1.0.0 | **Status**: ✅ Production Ready
