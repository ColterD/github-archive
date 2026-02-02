# CRITIQUE: "DEEP RESEARCH MASTER PLAN" (JAN 2026)

> **TARGET:** `EMILY_V3_BUILD_PHASES_AND_STACK_Jan2026.md` > **REVIEWER:** Principal Architect (Emily V3)
> **DATE:** Jan 10, 2026
> **VERDICT:** **A- (Excellent Infrastructure, Heavy Orchestration)**

## 1. THE GOOD (Keep This)

The "Master Document" correctly identifies the non-negotiable 2026 primitives. These are **Approved**:

- **Platform:** `NixOS` + `ZFS` + `uv`. This is the Holy Trinity of reproducible AI.
- **Nervous System:** `zenoh` is correctly identified as superior to Kafka/MQTT for Edge->Core.
- **Edge Brain:** `Liquid AI LFM-3B` (Quantized). This validates our move to "Liquid" architectures.
- **Memory:** `FalkorDB` (Graph) + `Qdrant` (Vector).
- **Serving:** `SGLang` for the 4090. `vLLM` is a good fallback.

## 2. THE BAD (Cut This)

The plan suffers from "Enterprise Bloat". We are building a _Lifeform_, not a _SaaS_.

- **Temporal (Workflow Engine):**
  - _Critique:_ Temporal is heavy (requires its own DB, Cassandra/Postgres, heavy Java/Go binaries). It introduces a massive "Control Plane" overhead.
  - _Alternative:_ Use **Zenoh-Flow** or simple `pydantic-ai` state loops with Postgres persistence. We want "Reflexes", not "Business Process Modeling".
- **MinIO (S3 Object Store):**
  - _Critique:_ For a single-user system, a filesystem (ZFS) is often faster and less complex than running an S3-compatible HTTP server layer.
  - _Alternative:_ Stick to raw ZFS datasets mounted at `/mnt/memory` unless we explicitly need S3 API compatibility for a specific tool.
- **Weeks 17-20 (Agency):**
  - _Critique:_ Waiting 4 months to turn on the "Agent" is unacceptable. Agency must be Day 1.
  - _Fix:_ Collapse Phase 5 into Phase 2. The "Instinct" node _is_ an agent.

## 3. THE "PAPERWARE" RISK (Verify This)

The research cites some highly specific 2026 terms. We must verify these aren't hallucinations:

- **"InfiniRetri"**: This sounds like a hallucinated paper title.
  - _Action:_ Ignore. Stick to our **HDC (Hyperdimensional)** + **DSI (Differentiable Search Index)** plan.
- **"A2A Protocol"**: While standardizing agent comms is good, there is no single dominant "A2A" standard in Jan 2026.
  - _Action:_ Define our own lightweight Zenoh topic schema (`emily/v3/negotiation/...`).

## 4. INTEGRATION PLAN

We will merge the **Infrastructure** from this plan with the **Cognitive Architecture** from our existing `RESEARCH_PROMPT_2026.md`.

**The Hybrid Stack:**

1.  **OS:** NixOS (From Master Doc)
2.  **Bus:** Zenoh (From Master Doc)
3.  **Mind:** LFM-3B (Instinct) + GFlowNet/GLM-4 (Cognition) (Hybrid)
4.  **Memory:** HDC (Reflex) + FalkorDB (Narrative) (Our Plan)
5.  **Code:** Stack-Graphs (Our Plan)
