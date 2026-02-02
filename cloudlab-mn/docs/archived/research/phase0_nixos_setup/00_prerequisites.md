# 00: Prerequisites

## Overview

This document outlines all requirements, preparations, and pre-setup tasks that must be completed before beginning the NixOS installation on CloudLab's c220g5 hardware.

**Time to Complete**: 30 minutes

## Table of Contents

1. [CloudLab Requirements](#cloudlab-requirements)
2. [Network Requirements](#network-requirements)
3. [Client-Side Requirements](#client-side-requirements)
4. [Knowledge Prerequisites](#knowledge-prerequisites)
5. [Preparation Checklist](#preparation-checklist)
6. [Optional but Recommended](#optional-but-recommended)

---

## CloudLab Requirements

### Account & Access

| Requirement | Description | How to Verify |
|-------------|-------------|---------------|
| **CloudLab Account** | Active CloudLab account with appropriate permissions | Log in to https://www.cloudlab.us/ |
| **Project Access** | Member of a project with c220g5 allocation | Check project hardware inventory |
| **Node Reservation** | Reserved c220g5 node for installation | Create experiment profile |

### Getting a c220g5 Node

1. **Log in to CloudLab**
   ```bash
   https://www.cloudlab.us/
   ```

2. **Create New Experiment**
   - Click "Start Experiment"
   - Choose "Wisconsin" or "Utah" cluster (c220g5 available)
   - Select profile or create custom

3. **Select c220g5 Hardware**
   - Search for "c220g5" in hardware list
   - Verify availability
   - Specify duration (minimum 4 hours recommended)

4. **Profile Configuration**
   ```
   Profile Name: nixos-setup-phase0
   Hardware: c220g5
   OS: Custom (we will install NixOS)
   ```

5. **Confirm Reservation**
   - Review all settings
   - Submit experiment
   - Wait for node provisioning (5-15 minutes)

### Hardware Verification

Once node is provisioned, verify specifications:

```bash
# Connect via SSH to CloudLab management node
ssh <username>@<cluster-node>.cloudlab.us

# Check CPU
lscpu | grep "Model name"
# Expected: Intel Xeon E5-2650 v4

# Check RAM
free -h
# Expected: ~256GB

# Check Storage
lsblk
# Expected: 4× NVMe drives (e.g., nvme0n1, nvme1n1, etc.)

# Check Network
ip link show
# Expected: Mellanox network interfaces
```

## Network Requirements

### Required Network Information

You will need the following information for installation:

| Parameter | Description | Example |
|-----------|-------------|---------|
| **IP Address** | Static IP for the server | 192.168.1.100/24 |
| **Gateway** | Default gateway IP | 192.168.1.1 |
| **DNS Servers** | Primary and secondary DNS | 8.8.8.8, 8.8.4.4 |
| **Hostname** | Server hostname | nixos-server-01 |
| **Domain** | Optional domain name | example.local |

## Next Steps

Once all prerequisites are met, proceed to [01_hardware_checklist.md](01_hardware_checklist.md).

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-01-12
