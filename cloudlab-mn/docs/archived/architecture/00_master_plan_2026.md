# EMILY V3: CONSOLIDATED ARCHITECTURAL RATIFICATION (JAN 2026)

> **AUTHOR:** Principal Architect (GitHub Copilot)
> **INPUTS:**
>
> 1. `sovereign.md` (The Neural Theory)
> 2. `EMILY_V3_BUILD_PHASES...md` (The Infrastructure Map)
> 3. `EMILY_V3_TECH_CHOICES...md` (The Defense)
>    **VERDICT:** **APPROVED WITH MODIFICATIONS**

## 1. THE UNIFIED VISION (THE "SOVEREIGN" STANDARD)

We are building a **Thermodynamic Lifeform**, not a Chatbot.
The merger of these three documents creates a coherent Level 4 system.

### The "Body" (Infrastructure & Transport)

- **Operating System:** **NixOS + ZFS**. (Startlingly good choice. Ensures immortality via snapshots).
- **Nervous System:** **Zenoh**. (Correct. Zero-copy, low-latency, edge-to-core).
- **Protocol:** **PydanticAI + A2A**. (Correct. Typed, structured, robust).

### The "Mind" (Bicameral Cognition)

- **System 1 (Instinct):** **Liquid Neural Networks (LFM-3B)** running on **Tesla P4**.
  - _Role:_ Active Inference (Minimizing Surprise), Sensory Gating, Routing.
  - _Note:_ The "Deep Research" suggestion of using DeepStream + GGUF is valid, but LNNs are the 2026 frontier.
- **System 2 (Cognition):** **GFlowNets** running on **Elastic Cluster**.
  - _Role:_ Creative Hypothesis Generation.
  - _Note:_ SGLang is the correct serving engine.

## 2. CRITICAL MODIFICATIONS (THE "REALITY CHECK")

I accept 90% of the findings. Here is the 10% we must change to avoid "Enterprise Bloat" and ensure robustness:

### A. The "Agency" Timeline

- **Finding:** Build Plan puts "Agency" in **Phase 5 (Week 17)**.
- **Correction:** **REJECTED.**
- **Reasoning:** Agency is not a plugin. In the _Active Inference_ model (`sovereign.md`), agency is intrinsic to perception. The P4 _must_ be an agent from Day 1 to minimize free energy.
- **New Plan:** Merge Phase 5 into **Phase 2**.

### B. The Storage Layer

- **Finding:** Use **MinIO** (S3 Object Store).
- **Correction:** **CONDITIONAL.**
- **New Plan:** Use **ZFS Datasets** mounted directly (`/mnt/memory`) for 99% of distinct storage. Only use MinIO if a specific tool (like an MLflow logger) _demands_ S3 compatibility. Don't run a web server just to write files to disk.

### C. The Executor

- **Finding:** Use **Temporal** for workflows.
- **Correction:** **CAUTION.**
- **New Plan:** Temporal is heavy (requires Java/Cassandra). For Phase 1-3, use **Zenoh-Flow** or simple `pydantic-ai` state loops. Upgrade to Temporal only if we need multi-month durable sagas.

### D. The Hardware Hierarchy (Elastic Cluster)

- **Finding:** Static assignment of roles (P4=Edge, 4090=Core).
- **Correction:** **ELASTICITY ADDED.**
- **New Plan:**
  - **Primary Brain:** Cloud API (OpenAI/Anthropic) for reliability (Day-to-Day).
  - **Elastic Cluster:**
    - **Tier 1:** Local 4090 (Privacy/Free/Deep Research).
    - **Tier 2:** DePIN/Octa.space (Infinite Scale/Failover).
  - **Logic:** The P4 routes to Cloud by default. It offloads deep/private tasks to Tier 1. If Tier 1 is full/down, it rents Tier 2.

## 3. FINAL TECH STACK (LOCKED IN)

| Layer          | Technology                         | Status       |
| :------------- | :--------------------------------- | :----------- |
| **Hardware A** | **Tesla P4** (Instinct/Router)     | 🟢 Confirmed |
| **Hardware B** | **Cloud API** (Primary Brain)      | 🟢 Confirmed |
| **Hardware C** | **Elastic Cluster** (4090 + DePIN) | 🟢 Confirmed |
| **OS**         | **NixOS + ZFS**                    | 🟢 Confirmed |
| **Net**        | **Zenoh**                          | 🟢 Confirmed |
| **Model A**    | **Liquid LFM-3B** (LNN)            | 🟢 Confirmed |
| **Memory**     | **HDC + FalkorDB**                 | 🟢 Confirmed |
| **Code**       | **Tree-sitter + Stack-Graphs**     | 🟢 Confirmed |
| **Agent**      | **PydanticAI**                     | 🟢 Confirmed |

## 4. NEXT ACTION (EXECUTION)

The research phase is **COMPLETE**. We have analyzed, critiqued, and unified the architecture.
Any further debate is procrastination.

**IMMEDIATE NEXT STEP:**
Initialize the **Semantic Code Intelligence**. We need to prove the "Self-Coding" capability.

- **Task:** Create `scripts/git_hooks/post-receive`.
- **Logic:** Trigger `stack-graphs` analysis on push.

## 5. CONNECTIVITY STANDARDS (THE API MESH)

To ensure forward compatibility (2026+), we establish a **Universal Protocol Shim**:

1.  **Primary Ingress (The Router):** litellm exposes a standardized OpenAI-Compatible endpoint (/v1/*).
    *   *Purpose:* All internal agents talk to *this*, never to outside providers directly.
    *   *Logic:* It routes requests to Z.ai, Local 4090, or Backups on the fly.
2.  **Provider Map:**
    *   **Z.ai:** Primary Daily Driver (High-Performance Cloud).
    *   **Internal Mesh:** Aggregates P4/4090/Octa.space into a single pool.
    *   **Anthropic/Gemini:** Configured but **Disabled-by-Default** (Emergency Reserves).
3.  **Future-Proofing:** Configuration is defined in config.yaml (Hot-Reloadable). Adding a new model (e.g., GPT-7) requires 0 code changes, only a config update.
