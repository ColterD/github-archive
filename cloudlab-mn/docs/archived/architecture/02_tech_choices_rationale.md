# EMILY Sovereign V3 — Tech Choices Rationale (Jan 2026)

This document explains **why the stack choices were selected over common alternatives**, using (a) your Perplexity/Gemini research artifacts and (b) up-to-date public sources where needed.

---

## Transport / “Nervous System”: zenoh

### Why zenoh
- Combines **pub/sub + query + storage** in one mesh-friendly protocol, reducing architectural glue.
- Designed for **heterogeneous networks** (edge ↔ core), with a focus on low overhead.
- Clean fit for “event-first” cognition loops (sensory stream → memory → action).

### Why not Kafka first
- Kafka is excellent at high-throughput log streaming, but is heavyweight operationally for an edge-first sovereign stack.
- For early phases, zenoh provides the needed capabilities with less operational surface area.

### Why not MQTT
- MQTT is simple for pub/sub but lacks the query/storage primitives you want as the backbone of a cognition system.

---

## Agent runtime: PydanticAI (+ A2A + MCP)

### Why PydanticAI
- “Typed agents”: tools and outputs are strongly validated, making runs reproducible and failures obvious.
- Pairs naturally with a schema-first memory layer (Pydantic models everywhere).

### Why not LangChain as the core
- LangChain is powerful, but tends to become a “framework gravity well” with high coupling across components.
- PydanticAI keeps the agent core smaller; you can still integrate LangChain/LangGraph selectively.

### Why A2A + MCP
- A2A standardizes agent-to-agent contracts.
- MCP standardizes tool execution across heterogeneous tool servers (local, remote, sandboxed).

---

## LLM routing: LiteLLM

### Why LiteLLM
- A single control plane for: local models, remote models, quotas, key management, logging hooks.
- Keeps “sovereign by default” while enabling optional remote escalation.

### Why not direct SDKs everywhere
- Direct SDK usage multiplies integration work and makes consistent observability/policy hard.

---

## Inference: SGLang + vLLM (+ TensorRT-LLM where it matters)

### Why SGLang first
- Strong throughput and batching characteristics for supported model families.

### Why vLLM as the compatibility fallback
- Broad model support, stable ecosystem, and good performance baseline.

### Why not only TensorRT-LLM
- Excellent on NVIDIA, but higher integration complexity and narrower flexibility for rapid model iteration.

---

## Memory: FalkorDB + Qdrant (+ Postgres + MinIO)

### Why FalkorDB (graph/CRDT)
- Graph structure matches cognition requirements: entities, events, causality, tool traces.
- CRDT/delta-style merges support multi-source knowledge and conflict tracking.

### Why Qdrant for vectors
- Fast, simple operational footprint, strong filtering; easy to deploy locally.

### Why not only pgvector
- pgvector is excellent for simplicity, but tends to lag specialized vector DBs at scale/throughput.
- If you want minimal components early, pgvector is a valid swap; otherwise Qdrant is the stronger default.

### Why MinIO
- S3-compatible interface enables ecosystem tools (dataset storage, checkpoints, eval artifacts) with low friction.

---

## Reproducibility / Dev experience: NixOS + ZFS + uv

### Why NixOS + ZFS
- Declarative host config and rollbacks reduce “it works on one node” drift.
- ZFS snapshotting provides immutable checkpoints for experiments and recovery.

### Why uv
- Very fast, lockfile-based python environments; reduces “pip entropy” across agents and services.

---

## Safety & uncertainty: PyMC + (DR-FREE / free-energy-inspired goals)

### Why probabilistic safety at all
- Lets you reason about uncertainty and shift, instead of pretending the world is i.i.d.
- Useful both for “tool usage gating” and “when to ask for more evidence.”

---

## Code intelligence: tree-sitter + Stack Graphs (+ SCIP/LSIF where useful)

### Why tree-sitter
- Best-in-class incremental parsing across many languages.
- Enables structure-aware retrieval and transformation.

### Why Stack Graphs
- A scalable approach to precise cross-file navigation that remains robust across repos.

---

## Workflow orchestration: Temporal

### Why Temporal
- Durable execution: retries, timeouts, compensation, and replay.
- Perfect for “agent runs” where partial progress must be preserved and audited.

### Why not cron + scripts
- Cron works for simple jobs; it breaks down once you need idempotency, retries, and distributed state.

---

## When to revisit these choices
- If you scale to many nodes with very high throughput, evaluate Kafka/Pulsar as the event backbone.
- If you need strict multi-tenant ML serving, evaluate KServe + GPU operator earlier.
- If memory scale exceeds single-cluster MinIO, evaluate Ceph or multi-site object storage.

