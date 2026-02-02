# Level 6: The Dreaming Architecture (Offline Consolidation)

> **Directive**: "Productive Sleep."
> **Status**: Experimental (2026).

## 1. Theoretical Basis: From Mimicry to Wisdom

**Level 4 (Mimicry)** relies on RAG: "Retrieve X, Generate Y." It is purely **Reactive**.
**Level 6 (sequential Decision)** is **Proactive**. It minimizes Expected Free Energy ($G$) over time.

However, $G$ depends on accurate **Priors** (Expectations). If the Agent expects "Humans are always angry," it will act paranoid.
**Dreaming** is the process of **Bayesian Model Reduction**:

1.  **Generative Replay**: The Agent simulates counterfactuals ("What if I had been more assertive?"). This is **Q-Learning** in an imaginary environment (`Dyna-Q`).
2.  **Synaptic Pruning**: High-entropy memories are discarded. Low-entropy patterns are crystalized into the `KnowledgeGraph`.
3.  **Setpoint Drift**: If the Agent spent the whole day with High Cortisol despite High Dopamine, the **Neurochemical Model** is wrong. Dreaming adjusts the `set_points` to align with reality (`Allostatic Calibration`).

## 2. The Architecture

### 2.1 The Cycle

`Volition.SLEEP` triggers the `Consolidator`.

1.  **Ingest**: Pull `EpisodicTraces` (Vector DB) from the last 16 hours.
2.  **Dream (Replay)**: Select high-salience negative events (High Risk). Use LLM to simulate alternative policies.
    - _Input_: "User yelled when I ignored them."
    - _Dream_: "Simulate acting with `Volition.CONNECTION` instead."
    - _Result_: "User is happy." -> Update `Policy` weights.
3.  **Consolidate**: Extract Entities/Relations from Traces + Dreams -> Push to `NarrativeMemory` (Graph).
4.  **Tune**: Calculate new `Neurotransmitters.set_points` to minimize future `Cortisol`.

## 3. Data Structures

### `DreamManifest`

The output of a sleep cycle.

```json
{
  "timestamp": 17978282,
  "synthetic_experiences": 14,
  "graph_nodes_created": 50,
  "neuro_adjustments": {
    "dopamine_sensitivity": 0.55,
    "cortisol_baseline": 0.05
  }
}
```
