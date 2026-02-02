# Environment Setup Plan (2026 Architecture)

> Based on `Architecture_Sovereign_Hypervisor.md`, `Investigation_Block_Storage.md`, and `Projects_Blueprint_2026.md`.
> **Goal:** Clean Local Workspace -> Deploy Remote CloudLab Cluster -> Connect via NVMe-oF.

## Phase 0: Local Cleanup (Windows)

Before deployment, standardization is required.

- [x] **Archive Legacy:** Move `*.archived` and old `.md` files to `archive/` or delete.
- [x] **Sanitize Repo:** Ensure no secrets in `infra/`. Verify `uv sync` works cleanly.
- [x] **Prepare Context:** Generate `manifest.yaml` for Emily.

## Phase 0.5: Codebase Recovery (2026 Audit)

The audit of `archive/` revealed several critical components ("Lost Gems") that have been restored.

- [x] **Recover Metabolism:** Swapped `scavenger.py` placeholder for V2 Vast.ai Autoscaler logic.
- [x] **Recover Senses:** Implemented `ReflexRegistry` in `vision.py` for <50ms audio bypass.
- [x] **Recover Security:** Verified "Imperishable Root" (ZFS Rollback) & Kernel Hardening (`kptr_restrict=2`) in `infrastructure/configuration.nix`.
- [x] **Recover Network:** Verified Google BBR & FQ congestion control in `infrastructure/configuration.nix`.
- [x] **Recover Flow:** Created `src/nervous_system/flow_controller.py` with TurnGPT logic and Audio Ducking.
- [x] **Recover Puppetry:** Created `src/bridge/puppetry` with Logit Bias injection.
- [x] **Recover HDC:** Added `HyperdimensionalLayer` to `src/cognition/memory/reflexive.py` for nanosecond binary-vector matching.
- [x] **Recover Mimi/Moshi:** Updated `src/instinct/senses/audio/__init__.py` to support End-to-End audio streaming.
- [x] **Recover Sleep Learning:** Updated `src/cognition/dreaming/consolidator.py` to capture DPO triplets (Context, Bad Draft, Correction) for overnight training.
- [x] **Recover Agent Squad:** Converted `src/kernel/speculation_engine.py` to a `AgentSquad` (V2 MoE) router with Intent Classification.
- [x] **Recover Physical Context:** Created `src/instinct/senses/proprioception.py` with Frustum Map (Living Room zones).
- [x] **Recover LNN:** Created `src/instinct/reflex/lnn.py` implementing Liquid Neural Networks (LTC) for continuous-time adaptation.
- [x] **Recover Vision Hierarchy:** Updated `src/instinct/senses/vision.py` to explicitly reference Level 1 (Moondream/LLaVA) local processing.
- [x] **Recover Genesis:** Created `scripts/genesis.sh` with Acoustic Health Check and Kernel security audit.

## Phase 0.6: 2026 Frontier Integration (Agent Upgrades)

Based on the [2026 Frontier Spec](../architecture/2026_frontier_spec.md), we have deployed the following "Agent Alpha-Zeta" upgrades:

- [x] **Agent Delta (The Archivist):** Implemented `src/memory/holomem.py` - Holographic Associative Memory using Circular Convolution (Vector-Symbolic Architecture).
- [x] **Agent Gamma (The Physicist):** Upgraded `src/metabolism/scavenger.py` - Integrated Thermodynamic Cost Optimization for H100/H200/B200 Blackwell Spot Auctions.
- [x] **Agent Zeta (The Hive):** Created `src/kernel/service_discovery.py` - Implemented Stigmergic "Pheromone" Discovery for decentralized swarm coordination.
- [x] **Biological Grounding:** Implemented `src/metabolism/circadian.py` - Added 24h metabolic cycles (Cortisol/Melatonin) to regulate compute intensity.
- [x] **Sensory Gating:** Added 10Hz "Alpha Rhythms" to `src/nervous_system/flow_controller.py` to modulate attention during internal thought.

## Phase 1: CloudLab Deployment (Remote)

### A. Provisioning (Physical Layer)

**Target Hardware:** CloudLab c220g5 (or equivalent)

- **CPU:** 2x Xeon E5-2690v4 (28 Cores / 56 Threads)
- **RAM:** 128GB DDR4 ECC
- **Storage:** 2x 2TB NVMe + 14x 12TB HDD (Adjusted for Availability)
- **Network:** 1Gbps Unmetered
- **GPU:** Nvidia P4 (Instinct Node)

### B. OS Installation (The "Imperishable/Confidential" Root)

1. **Boot:** Boot standard CloudLab disk image.
2. **Kexec/Install:** Pivot to NixOS Installer via RAM.
3. **Partitioning (2x 2TB NVMe Strategy - Mirrored):**
   _With 2 drives, we shift to High-Availability Mirroring. 2TB "marketing" = ~1.8TB usable per drive._
   - **p1 (Boot):** 512MB EFI (Mirrored content). 512MB is sufficient for NixOS multiboot scenarios.
   - **p2 (Swap):** 32GB (Priority Balanced).
   - **p3 (/nix):** **200GB Nix Store** (Mirrored, ext4). System packages with growth room for NixOS 25.05+ updates.
   - **p4 (rpool):** **~1.6TB Unified Pool** (Mirrored, ZFS). Apps, VMs, databases, builds, containers. **SERVER-ONLY - not mounted to clients.**
   - **p5 (Special VDEV):** **64GB Special VDEV** (Mirrored, ZFS). Metadata + small files (≤32KB) acceleration for ember pool. _Sized at 0.5-2.5% of pool capacity per 2026 best practices._
4. **Hardening (High Assurance):**

   - **Secure Boot:** Use `Lanzaboote` for TPM2-backed Secure Boot.
   - **Confidential Computing:** Enable AMD SEV-SNP (`mem_encrypt=on`) to prevent hypervisor introspection.

5. **Tier 0 Service (The Home Gateway Controller):**
   - **Container:** Docker/Podman container for `UniFi Network Application`.
   - **Purpose:** Adopts the home `UXG-Lite` router.
   - **Function:** Establishes Site-to-Site WireGuard VPN between CloudLab and Home LAN (192.168.x.x). Allows "Brain" to control Home IoT/Robots directly, even if Desktop is offline.

### C. ZFS Storage Pool (`ember`)

**Updated for 2026 Standards (RAIDZ2 + Special VDEV):**

- **Disks:** 14x 12TB HDDs.
- **Topology:** Two 7-wide RAIDZ2 vdevs (Traditional RAID).
  - **2026 Research Finding:** dRAID is designed for arrays with 100+ disks. For 14 disks, traditional RAIDZ2 provides **better capacity efficiency** (+9 TB) and **superior small-file performance**.
  - **Configuration:** `raidz2 disk0-6` and `raidz2 disk7-13` (two independent vdevs).
  - **Alignment:** Each vdev is 7-wide (5 Data + 2 Parity).
  - **Usable Capacity:** **~120 TB** (~109 TiB) - **9 TB more than dRAID**.
  - **Rebuild Time:** ~55-60 hours (vs dRAID's ~15-25 hours). Acceptable trade-off for +9 TB permanent capacity.
- **Acceleration (Special VDEV - OpenZFS 2.4+):**
  - **Special VDEV:** using `p5` from both NVMe drives (64GB mirrored each).
  - **2026 Sizing Best Practice:** Special VDEV should be 0.5-2.5% of pool capacity. For 120 TB pool, 64GB is generous and sufficient.
  - **Function:** Stores metadata, small files (≤ special_small_blocks), and ZIL/synchronous writes.
  - **2026 Consensus:** Special VDEV is superior to L2ARC for 800k file workloads (persistent, not cache).
- **NixOS Requirement:**
  - Must use `boot.zfs.package = pkgs.zfs_unstable;` (OpenZFS 2.4.0) to support modern RAIDZ expansion, ZIL on special vdev, and zstd-3 compression.
- **Creation:**

  ```bash
  # === NIXOS INSTALLATION: Partition & Format ===
  # Run these commands during NixOS installation

  # 1. Partition both NVMe drives (repeat for nvme-B)
  # Adjust disk paths based on your hardware (use lsblk to find)
  sgdisk /dev/disk/by-id/nvme-A \
    -n 1:0:+512M  -c 1:EFI \
    -n 2:0:+32G   -c 2:Swap \
    -n 3:0:+200G  -c 3:Nix \
    -n 4:0:+1600G -c 4:rpool \
    -n 5:0:+64G   -c 5:Special

  # Repeat for nvme-B (mirrored layout)
  sgdisk /dev/disk/by-id/nvme-B \
    -n 1:0:+512M  -c 1:EFI \
    -n 2:0:+32G   -c 2:Swap \
    -n 3:0:+200G  -c 3:Nix \
    -n 4:0:+1600G -c 4:rpool \
    -n 5:0:+64G   -c 5:Special

  # 2. Format EFI and Nix partitions
  mkfs.vfat -F32 -n BOOT /dev/disk/by-id/nvme-A-part1
  mkfs.ext4 -L NIX /dev/disk/by-id/nvme-A-part3

  # 3. Create Swap (on first drive only - use as swap device)
  mkswap -L SWAP /dev/disk/by-id/nvme-A-part2

  # 4. Create rpool (Unified NVMe Pool - SERVER-ONLY)
  zpool create -o ashift=12 -o autoexpand=on \
    -O compression=zstd-3 -O xattr=sa -O atime=off \
    -O mountpoint=/rpool \
    rpool mirror /dev/disk/by-id/nvme-A-part4 /dev/disk/by-id/nvme-B-part4

  # 5. Create rpool datasets
  zfs create rpool/apps        # Applications (*arr stack, UniFi, etc.)
  zfs create rpool/vms         # VMs/LXC containers
  zfs create rpool/databases   # FalkorDB, PostgreSQL, MongoDB
  zfs create rpool/builds      # Build artifacts
  zfs create -o mountpoint=/persist rpool/persist  # NixOS persist

  # 6. Create ember pool (HDD RAIDZ2 with Special VDEV)
  # Using two 7-wide RAIDZ2 vdevs for optimal 14-disk geometry
  zpool create -o ashift=12 -o autoexpand=on \
    -O compression=zstd-3 -O xattr=sa -O atime=off \
    -O recordsize=1M \
    ember \
    raidz2 /dev/disk/by-id/ata-HDD_1 /dev/disk/by-id/ata-HDD_2 /dev/disk/by-id/ata-HDD_3 \
          /dev/disk/by-id/ata-HDD_4 /dev/disk/by-id/ata-HDD_5 /dev/disk/by-id/ata-HDD_6 \
          /dev/disk/by-id/ata-HDD_7 \
    raidz2 /dev/disk/by-id/ata-HDD_8 /dev/disk/by-id/ata-HDD_9 /dev/disk/by-id/ata-HDD_10 \
          /dev/disk/by-id/ata-HDD_11 /dev/disk/by-id/ata-HDD_12 /dev/disk/by-id/ata-HDD_13 \
          /dev/disk/by-id/ata-HDD_14 \
    special mirror /dev/disk/by-id/nvme-A-part5 /dev/disk/by-id/nvme-B-part5

  # 7. Configure Special VDEV per-dataset (CRITICAL: not global!)
  # Create datasets first, then set special_small_blocks per dataset
  zfs create ember/code
  zfs set recordsize=16K ember/code
  zfs set special_small_blocks=16K ember/code  # MUST match recordsize!

  zfs create ember/models
  zfs set recordsize=1M ember/models
  zfs set special_small_blocks=32K ember/models  # OK: 32K < 1M

  zfs create ember/media
  zfs set recordsize=1M ember/media
  zfs set special_small_blocks=32K ember/media  # OK: 32K < 1M
  ```

### D. Network Protocol: SMB 3.1.1 Multichannel (2026 Standard)

- **Technology:** **SMB 3.1.1 with Multichannel** over WireGuard VPN.
- **2026 Optimization:**
  - Windows 11 has native, stable SMB 3.1.1 support
  - Multichannel aggregates multiple connections for better throughput
  - Special VDEV provides metadata acceleration (server-side)
- **Expected Performance (1Gbps):** 100-115 MB/s for large files, NVMe-speed for small files (metadata cached)
- **Service:** Samba 4.20+ on NixOS with multichannel enabled.
- **Export:** `/ember/code`, `/ember/models`, `/ember/media` via SMB.

---

## Phase 2: Local Client (Windows 11 - Minnesota)

### A. Hardware: Dedicated 2TB NVMe Dev Drive

- **Drive:** 2TB NVMe SSD (separate from OS/boot drive)
- **Drive Letter:** `D:\` (Dev Drive)
- **Format:** ReFS with Windows 11 "Dev Drive" optimizations enabled
- **Purpose:** Active development, local services, working datasets

### B. Dev Drive Configuration (2026 Layout)

```powershell
# Initialize and format as Dev Drive
Format-Volume -DriveLetter D -FileSystem ReFS -NewFileSystemLabel "DevDrive" -DevDrive $true

# Exclude from Defender Real-Time Protection
# Settings → Virus & threat protection → Exclusions → Add D:\

# Directory Structure
D:\src\                  # Active development projects (400GB)
D:\builds\               # Compilation outputs (300GB)
D:\models\               # Working set synced from server (300GB)
D:\cache\                # venvs, .cargo, npm, pip cache (200GB)
D:\services\             # Local services, Docker, WSL2 (200GB)
D:\temp\                 # Temporary files (100GB)
D:\overflow\             # Growth buffer (500GB)
```

### C. Storage Architecture Summary

| Drive | Type | Size | Purpose |
|-------|------|------|---------|
| `C:\` | NVMe SSD | OS/Apps | Windows, tools, system files |
| `D:\` | **ReFS Dev Drive** | **2TB** | Active dev, builds, services, models |
| `Z:\` | **SMB 3.1.1** | 120TB | Server code (ember/code) |
| `M:\` | **SMB 3.1.1** | 120TB | Server models (ember/models) |
| `A:\` | **SMB 3.1.1** | 120TB | Server archives (ember/media) |

**Server-Side (Cloud):**
- **rpool:** ~1.6TB NVMe mirror (SERVER-ONLY) - Apps, VMs, databases, builds
- **ember:** 120TB HDD (two 7-wide RAIDZ2 vdevs) + 64GB Special VDEV - Shared data via SMB

**2026 Key Improvements:**
- Switched from dRAID to RAIDZ2: **+9 TB capacity** (111 TB → 120 TB)
- Reduced Special VDEV: **250GB → 64GB** (still generous, properly sized)
- Fixed special_small_blocks: **Per-dataset configuration** (not global)
- Increased /nix: **128GB → 200GB** (growth room for NixOS updates)
- Reduced EFI: **2GB → 512MB** (sufficient, frees 1.5GB)

### D. Networking (SMB 3.1.1 + WireGuard)

- **Protocol:** SMB 3.1.1 Multichannel over WireGuard VPN.
- **Client:** Windows 11 native SMB client (no additional software needed).
- **Windows Configuration:**
  ```powershell
  # Enable SMB 3.1.1 multichannel
  Set-SmbClientConfiguration -EnableMultiChannel $true

  # Map network drives
  New-PSDrive -Name "Z" -Root "\\server\code" -PSProvider FileSystem -Persist
  New-PSDrive -Name "M" -Root "\\server\models" -PSProvider FileSystem -Persist
  New-PSDrive -Name "A" -Root "\\server\media" -PSProvider FileSystem -Persist

  # Performance tuning
  Set-SmbClientConfiguration -DirectoryCacheEntriesMax 1024
  Set-SmbClientConfiguration -FileNotFoundCacheEntriesMax 128
  ```
- **Mount Point:** SMB shares mapped as Z:, M:, A: drives

---

## Phase 3: Deployment Checklist

- [x] **Phase 0: Local Cleanup** (Archive old docs, verify clean repo).
- [ ] **Phase 1: CloudLab Provisioning** (Boot, Partition NVMe with Special VDEV, Install NixOS/Lanzaboote).
- [ ] **Phase 2: ZFS Construction** (Two 7-wide RAIDZ2 + Special VDEV + rpool).
- [ ] **Phase 3: Network Fabric** (WireGuard + Samba 3.1.1 + BBR tuning).
- [ ] **Phase 4: Local Dev Drive** (Install 2TB NVMe, Format as ReFS Dev Drive on D:\).
- [ ] **Phase 5: Client Connection** (Windows SMB 3.1.1 -> Z:, M:, A: drives).
- [ ] **Phase 6: Workspace Sync** (Mirror clean repo to D:\src).

**2026 Configuration Notes:**
- **RAIDZ2 instead of dRAID:** Better for 14 disks, +9 TB capacity (120 TB vs 111 TB)
- **Special VDEV:** 64GB per drive (0.5-2.5% of pool capacity per best practices)
- **OpenZFS 2.4.0:** Latest stable (Dec 2025), supports ZIL on special vdev
- **special_small_blocks:** Set per-dataset, NOT globally (critical for correct data placement)
- **Tmpfs root:** Add `size=2G` option to prevent OOM issues
