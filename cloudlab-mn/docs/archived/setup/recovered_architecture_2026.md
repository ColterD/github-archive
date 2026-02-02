# Recovered Architecture 2026 (The "Lost" Gems)

> **Status:** Retrieved from `archive/` on 2026-01-11.
> **Directive:** These components are approved for Phase 2+ implementation.

## 1. Network & Infrastructure

- **Tier 0 "Headless" Access:**
  - **Source:** `archive/global_mesh.md`
  - **Concept:** Host UniFi Controller on CloudLab to manage Home UXG-Lite via Site-to-Site VPN.
  - **Benefit:** Emily controls Home IoT/Robots even when the Desktop is offline.
- **Imperishable Root:**
  - **Source:** `archive/04_hypervisor_imperishable.md`
  - **Concept:** Root filesystem is `tmpfs` or ZFS rollback. Runtime state is wiped on reboot.
  - **Security:** Lanzaboote (Secure Boot) + TPM.

## 2. Cognition & AI

- **Agent Squad (Service-Level MoE):**
  - **Source:** `archive/06_agent_squad.md`
  - **Concept:** Replace monolithic `SpeculationEngine` with a Gating Model + Specialized GGUFs (Code, Logic, Creative).
- **Sleep Learning (DPO Loop):**
  - **Source:** `legacy_docs/SCRATCHPAD_OLD.md`
  - **Concept:** Log `(Context, Draft, Correction)` triplets during the day. Fine-tune the small "Instinct" model overnight to reduce error rates.
- **Hyperdimensional Computing (HDC):**
  - **Source:** `legacy_docs/SCRATCHPAD_OLD.md`
  - **Concept:** Use 10k-bit binary vectors for nanosecond "Reflex" memory matching, reserving the Graph DB for "Narrative" memory.

## 3. DevOps & Tooling

- **Semantic Git Hooks:**
  - **Source:** `legacy_docs/SCRATCHPAD_OLD.md`
  - **Concept:** `post-receive` hooks use `tree-sitter` to index code changes immediately into vector memory.
- **Mojo-Forward Python:**
  - **Source:** `archive/mojo_forward_python.md`
  - **Concept:** Strict typing/dataclasses to ensure future compilation to Mojo.

## 4. Recovered Physics (The "Deep Dive" Findings)

- **Neural Puppetry (Logit Bias):**
  - **Source:** `archive/puppetry.md.archived`
  - **Concept:** Direct control of the "Limb" model's tone via Logit Bias injection (mathematical probability shifts) rather than text prompting.
  - **Mechanic:** Dynamic LoRA hot-swapping (<10ms) for "Joking" vs "Clinical" modes.
- **Reflex Registry:**
  - **Source:** `archive/src_legacy/senses/INSTINCT_VISION_2.0.md`
  - **Concept:** `Regex -> Audio` map. Bypasses LLM. "See Cat" -> Play "Kitty.wav" (<50ms).
- **Mimi/Moshi Audio Stack:**
  - **Source:** `archive/src_legacy/senses/audio/mimi_kyutai.py`
  - **Concept:** End-to-End Audio-to-Audio streaming (Kyutai) instead of discrete STT->LLM->TTS.

## 5. Security Protocols (The "Immune System")

- **Kernel Hardening:**
  - **Source:** `archive/02_security.md`
  - **Concept:** Explicit `sysctl` rules to hide kernel pointers (`kptr_restrict=2`) and disable unprivileged eBPF (`unprivileged_bpf_disabled=1`).
- **Container Hardening:**
  - **Source:** `archive/02_security.md`
  - **Concept:** `systemd-nspawn` containers must run with `--no-new-privileges` and `--cap-drop=all` (zero trust).

## 6. Metabolism & Physics (The "Final Audit" Findings)

- **Vast.ai Autoscaling:**
  - **Source:** `archive/src_legacy/metabolism/scavenger.py`
  - **Concept:** Logic to auto-rent RTX 3090s (`<$0.20/hr`) for training, Copy LoRA out, terminate.
- **Physical Context Map:**
  - **Source:** `archive/physical_context.md.archived`
  - **Concept:** Hardcoded "Frustum Map" of the Living Room (Desk=Rect(0,360,0,720)).
- **Liquid Neural Networks (LNN):**
  - **Source:** `archive/research_dump_2026.txt`
  - **Concept:** Mandate for **INT8 Quantized LTCs** on the P4 for continuous-time sensor adaptation.
- **Storage Tunables:**
  - **Source:** `archive/05_sovereign_block_storage.md`
  - **Concept:** `tcp_notsent_lowat = 16384` (Bufferbloat fix) and `l2arc_rebuild_enabled=1` (Persistent Cache).

## 7. Nervous System & Physics (The "Flow" Findings)

- **Dynamic Conversational Flow:**
  - **Source:** `archive/src_legacy/nervous_system/flow_controller.py`
  - **Concept:** Variable Silence Timeout (700ms -> 50ms) based on `TurnGPT` end-of-turn probability.
  - **Mechanic:** "Audio Ducking" (90% vol reduction) on high-energy interruptions.
- **Acoustic Health Check:**
  - **Source:** `archive/genesis.sh.archived`
  - **Concept:** `/opt/emily/assets/startup.wav` must play on boot to confirm kernel-audio health.
- **Vision Stack Hierarchy:**
  - **Source:** `archive/src_legacy/senses/SENSORY_STACK_P4.md`
  - **Concept:** Level 0 (Motion) -> Level 1 (Moondream) -> Level 2 (Cloud).
  - **Update:** `vision_service.py` suggests upgrading P4 to `LLaVA-NeXT` if VRAM permits, with Moondream fallback.

## 8. Physical & Network Identity (The "Genesis" Findings)

- **BIOS / Hardware Policy:**
  - **Source:** `archive/phase_0_checklist.md`
  - **Settings:** Wake-on-LAN (WoL) MUST be enabled. "Restore on AC Power Loss" MUST be set to "Power On".
- **Mesh Hostnames:**
  - **Source:** `archive/phase_0_checklist.md`
  - **Naming:**
    - Desktop: `emily-limb-mn`
    - Cloud: `emily-core-ut`
    - Mobile: `emily-eye` (Pixel)
- **UI Interaction:**
  - **Source:** `archive/apps/desktop-ui/src-tauri/tauri.conf.json`
  - **Concept:** "Ghost Overlay" (Transparent, undecorated window) for the desktop interface.
    xpanded_skill_registry.md`.omitted line marker to an edit tool.
