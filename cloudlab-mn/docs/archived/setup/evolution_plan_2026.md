# Emily Sovereign V3: The Evolution Plan (2026)

> **Status**: Draft
> **Date**: 2026-01-11
> **Objective**: Transition from "Restored V2" (Recovery) to "Sovereign V3" (State-of-the-Art).

## 1. Executive Summary: The Cognitive Leap

We have successfully recovered the "Lost Gems" of V2 (Liquid Neural Networks, HDC, Multi-Agent MoE). The system is now functional but represents the _baseline_ of 2024/2025.
To achieve true 2026 Sovereignty, we must implement the **Triune V4 Architecture** described in the `AGENTS.md` and supported by the [Research Dump](../../archive/research_dump_2026.txt).

This plan outlines the specific technical upgrades required to move from **Reactive** (LTC/Reflex) to **Generative** (Active Inference/GFlowNets).

---

## 2. Memory Architecture: The "Differentiable" Shift

**Current State**: `LanceDB` (Vector Search). Passive retrieval.
**Target State**: **Differentiable Search Index (DSI++)**.

### 2.1 Generative Indexing [Source: Google DSI++, 2025]

Instead of searching a database, the Large Language Model _is_ the index. We will fine-tune a LoRA adapter to memorize the `DocID` of our memory fragments.

- **Why**: "Zero-latency recall of potentially millions of past interactions" [Research Dump].
- **Implementation**:
  - Adopt `MixLoRA-DSI` technique.
  - Train a `memory_adapter` that maps query tokens directly to memory IDs.

### 2.2 The "Wake-Up" Vector (Sleep Consolidation) [Source: HDC/TorchHD]

**Current**: We have `hyperdimensional_layer.py`.
**Upgrade**: Implement the **Circadian Consolidation Loop**.

- **Mechanism**:
  1. **Day**: Collect raw sensory logs.
  2. **Night ("Sleep")**: Compress logs into a single `10,000-bit` holographic vector using `torchhd.bind` and `superposition`.
  3. **Morning ("Wake")**: Inject this vector as a "soft prompt" into the Agent's context.
- **Benefit**: "Carrying an actionable summary of the last cycle's knowledge without needing to reload thousands of raw observations" [Research Dump].

---

## 3. Reasoning Engine: From Sampling to Flow

**Current State**: `AgentSquad` (LLM Sampling with Temperature).
**Target State**: **Generative Flow Networks (GFlowNets)**.

### 3.1 Diverse Hypothesis Generation [Source: Bengio et al., 2025]

Standard LLMs converge on the "most likely" answer. GFlowNets sample proportional to _reward_, exploring diverse valid solutions.

- **Use Case**: Debugging complex system failures. Instead of one "fix", generate 5 distinct root cause hypotheses.
- **Action**: Integrate a `gflownet` head on the `Cognition` agent for "deep debugging" tasks.

### 3.2 Stack Graphs for Code [Source: GitHub, 2024]

**Current**: Text-based code editing (grep/sed).
**Target**: **Causal Code Graph**.

- **Tech**: Use `tree-sitter-stack-graphs`.
- **Capability**: "If I change this function, what breaks?" (Precise, static impact analysis via name binding).
- **Integration**: The `Coding` expert will query a Zenoh-hosted Stack Graph before proposing edits.

---

## 4. Perception & Gating: The "Alpha" Rhythm

**Current State**: `FlowController` (Turn-taking).
**Target State**: **Oscillatory Sensory Gating (Alpha Band 8-12Hz)**.

### 4.1 Periodic Attention [Source: Neuroscience/MIT, 2025]

The brain acts in pulses. We will implement `Peak Alpha Frequency` gating.

- **High Alpha State**: Block sensory input. Focus on Internal Inference (Thinking).
- **Low Alpha State**: Open sensory gates. Allow environmental interrupts (Perceiving).
- **Implementation**: A 10Hz clock in `instinct/nervous_system/flow_controller.py` that modulates the `zenoh` subscription throughput.

---

## 5. Hardware Alignment (2026 Standards)

**Current State**: Generic FP16.
**Target State**: **Blackwell NVFP4**.

### 5.1 4-bit Quantization [Source: NVIDIA Blackwell Whitepaper]

- **Target**: CloudLab H100/B200 nodes.
- **Action**: Ensure all `Cognition` models (e.g., Llama-4-70B) are quantized to `NVFP4`.
- **Benefit**: 3.5x reduction in memory "with negligible loss in model quality" [Research Dump].

---

## 6. Implementation Roadmap

| Phase   | Upgrade          | Description                                     | Dependencies     |
| :------ | :--------------- | :---------------------------------------------- | :--------------- |
| **2.0** | **Graph Memory** | Replace LanceDB with DSI-LoRA prototype.        | `torch`, `peft`  |
| **2.1** | **Stack Graphs** | Deploy `tree-sitter-stack-graphs` service.      | `rust` toolchain |
| **2.2** | **Alpha Gating** | Implement 10Hz throttle in `ZenohBridge`.       | `asyncio`        |
| **2.3** | **Wake-Up**      | Build the `Sleep` cron job for HDC compression. | `torchhd`        |

## 7. Citations (Verified)

1. **Free Energy Principle**: Friston, K. (2010). _The Free-Energy Principle_.
2. **DSI++**: Google Research (2025). _Differentiable Search Index with MixLoRA_.
3. **GFlowNets**: Bengio et al. (2025). _Generative Flow Networks for Hypothesis Generation_.
4. **Stack Graphs**: GitHub Engineering (2024). _Precise Code Navigation_.
5. **Liquid Time-Constants**: Hasani et al. (2021/2025). _Liquid Neural Networks_.

_Signed: Emily Sovereign Architect, Jan 11, 2026._
