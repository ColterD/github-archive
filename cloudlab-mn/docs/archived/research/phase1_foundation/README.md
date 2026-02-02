# Phase1: Foundation - Observability, Vector DB, Inference, Multi-Agent

**Project**: Emily Sovereign V4
**Timeline**: 2026-01 to 2026-02 (4 weeks)
**Status**: Planning Phase
**Priority**: P0 - Foundation for all subsequent phases

---

## Overview

Phase 1 establishes foundational infrastructure required for Emily Sovereign V4 cognitive architecture. This phase focuses on deploying critical observability tools, vector database capabilities, high-performance inference serving, and multi-agent orchestration.

### Critical Hardware Context

**Platform**: CloudLab c220g5

| Component | Specification | Impact |
|-----------|---------------|---------|
| **CPU** | 28 cores (Intel Xeon) | Moderate parallel processing |
| **RAM** | 128GB DDR4 | Sufficient for vector DB cache |
| **GPU** | Tesla P4 (8GB GDDR5, Pascal) | **Constraints** inference choices |
| **Storage** | HDD array (ZFS RAIDZ2) | Affects vector DB performance |
| **Network** | 1Gbps with WireGuard VPN | Limits transfer speeds |

**⚠️ Critical Hardware Constraint**: Tesla P4 (Pascal architecture, compute capability 6.1) is **incompatible** with vLLM (requires 7.0+). This document uses **SGLang** as the primary inference framework.

---

## Phase 1 Components Summary

### 1. Observability Stack (Week 1)
**Tools**: Cilium (eBPF), Hubble, Langfuse
- Deep network-level observability with eBPF (Cilium)
- Real-time flow visualization (Hubble)
- LLM-specific tracing and evaluation (Langfuse)

### 2. Vector Database (Week 2)
**Tool**: pgvector (PostgreSQL extension)
- High-performance vector similarity search
- Affective state retrieval (3D vectors)
- Semantic memory retrieval (1536D embeddings)

### 3. Inference Server (Week 2-3)
**Tool**: **SGLang** (NOT vLLM - Tesla P4 incompatible)
- High-performance LLM inference
- OpenAI-compatible API
- Low-latency policy generation

### 4. Multi-Agent Framework (Week 3-4)
**Tools**: CrewAI OR LangGraph (evaluate both)
- Orchestrate Triune Architecture agents
- Enable hierarchical fault tolerance
- Support Active Inference loops

### 5. MLflow Integration (Week 4)
**Tool**: MLflow 2.18+
- Experiment tracking with LLM evaluation
- Model registry with stage transitions
- ML Metadata (MLMD) for lineage

### 6. DVC Integration (Week 4)
**Tool**: DVC (Data Version Control)
- Dataset versioning with drift detection
- Reproducible data pipelines
- Cloud-native remote caching

### 7. Feast Feature Store (Week 4)
**Tool**: Feast (v0.40+) with Redis online store
- Hybrid online/offline serving
- Real-time feature retrieval (<10ms)
- Feature transformations in Feast

### 8. Testing Infrastructure (Week 4)
**Tools**: Pytest, Hypothesis, Coverage
- Property-based tests for core algorithms
- Integration tests for Triune system
- >70% code coverage

---

## Critical Performance Corrections

### pgvector Performance (CloudLab c220g5)

| Metric | Claimed (Incorrect) | Actual (CloudLab) | Source |
|--------|---------------------|-------------------|--------|
| **QPS at 99% recall** | 471 | **~80** | REVIEW_AGENT_3_MLOPS.md |
| **QPS at 95% recall** | N/A | ~150 | pgvector benchmarks |
| **QPS at 90% recall** | N/A | ~300 | pgvector benchmarks |

**Why Discrepancy**:
- Original claim based on: 32-core CPU, 256GB RAM, **NVMe SSD**
- CloudLab reality: 28-core CPU, 128GB RAM, **HDD storage**
- Storage I/O is the bottleneck, not compute

### Tesla P4 GPU Compatibility

| Inference Framework | Tesla P4 Support | Reason |
|-------------------|------------------|---------|
| **vLLM** | ❌ **NO** | Requires compute capability 7.0+ (Volta/Turing); P4 is 6.1 (Pascal) |
| **SGLang** | ✅ **YES** | Supports Pascal architecture with proper quantization |
| **llama.cpp** | ✅ **YES** | CPU+GPU hybrid, fallback option |

**Why SGLang**:
1. Hardware Compatibility: Tesla P4 (Pascal) lacks tensor cores required by vLLM's PagedAttention
2. Quantization Support: AWQ (4-bit) to fit models in 8GB VRAM
3. Structured Generation: Better for policy generation (Active Inference)
4. Multi-LoRA Serving: Future-proof for specialized agents

### Feast Online Store Requirement

**Without Redis online store**: 500ms-2s latency (file source scanning)
**With Redis online store**: <10ms latency (in-memory lookup)

---

## Implementation Order

### Week 1: Observability (Foundation)
1. Deploy Cilium + Hubble (kernel version check)
2. Deploy Langfuse (Docker)
3. Configure eBPF TracingPolicy for Zenoh

### Week 2: Vector DB + Inference
1. Install PostgreSQL + pgvector
2. Create HNSW indexes with tuned parameters
3. Deploy SGLang runtime (Phi-3-mini, AWQ)
4. Configure OpenAI-compatible API

### Week 3: Multi-Agent
1. Implement CrewAI agents (Triune Architecture)
2. Implement LangGraph alternative (for evaluation)
3. Configure Redis-backed state
4. Integrate Langfuse telemetry

### Week 4: MLOps Integration
1. Deploy MLflow 2.18+ with LLM evaluation
2. Setup DVC pipeline with drift detection
3. Deploy Feast with Redis online store
4. Configure testing infrastructure

---

## Expected Outcomes

### Quantitative Metrics

| Metric | Target |
|--------|---------|
| **Vector DB QPS** | >80 (99% recall) |
| **Inference Latency** | <200ms (TTFT), <70ms/token |
| **Agent Loop Time** | <5s (full Triune) |
| **Network Observability Overhead** | <5% |
| **Test Coverage** | >70% |
| **Feature Retrieval Latency** | <10ms (online) |

### Qualitative Outcomes
- ✅ Deep visibility into network flows (eBPF)
- ✅ End-to-end LLM tracing (Langfuse)
- ✅ High-performance vector search (pgvector)
- ✅ Production-ready inference (SGLang)
- ✅ Orchestrated multi-agent system (CrewAI/LangGraph)
- ✅ Reproducible experiments (MLflow + DVC)
- ✅ Real-time feature serving (Feast + Redis)
- ✅ Comprehensive test coverage (Pytest + Hypothesis)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|-------|------------|---------|------------|
| **Tesla P4 OOM** | High | High | Use AWQ 4-bit quantization, reduce context to 2048 |
| **pgvector too slow** | Medium | High | Fallback to Qdrant if <50 QPS |
| **Cilium kernel incompatibility** | Low | Critical | Verify NixOS kernel >= 5.15 before deployment |
| **CrewAI latency >5s** | Medium | Medium | Migrate to LangGraph for stateful execution |
| **Redis SPOF** | Low | High | Deploy Redis Sentinel (HA) |

---

## Sources

### Review Agent Corrections
- REVIEW_AGENT_1_INFRASTRUCTURE.md - ZFS, networking, monitoring
- REVIEW_AGENT_3_MLOPS.md - pgvector performance, MLflow, Feast
- REVIEW_AGENT_4_NOVEL_TECH.md - SGLang vs vLLM, CrewAI vs LangGraph

### Official Documentation
- SGLang Documentation: https://docs.sglang.io/
- Cilium + Hubble Documentation: https://docs.cilium.io/
- pgvector GitHub: https://github.com/pgvector/pgvector
- MLflow 2.18+ Documentation: https://mlflow.org/docs/latest/
- DVC Documentation: https://dvc.org/
- Feast Documentation: https://feast.dev/

### Research Papers
- Friston, K. (2010). "The Free-Energy Principle"
- Solomon, R. L. (1980). "Opponent-Process Theory"
- Dehaene, S. (2014). "Consciousness and the Brain" (GWT)

---

**Next Phase**: Phase 2: CI/CD Excellence
**Previous Phase**: Phase 0: NixOS Setup

---

*Document Created*: January 12, 2026
*Status*: Ready for Implementation
