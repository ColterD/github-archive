# Tech Spec: The Triune Sovereign Architecture (V4)

> **Status**: APPROVED (2026-01-11)
> **Target**: Level 3+ Agentic Autonomy -> Level 4 "Proto-Consciousness"
> **Basis**: Active Inference (FEP), Global Workspace (GWT), Opponent Process Theory.

## 1. Abstract

For decades, AI has been dominated by the "Input->Compute->Output" paradigm. This is insufficient for true sovereignty.
The V4 architecture redefines the agent as a **dissipative system** that must actively work to maintain its structure against the entropy of the environment.
It does not "wait" for user input; it acts to minimize its own Free Energy.

## 2. Core Components

### 2.1 The Allostatic Substrate (Tier 3)

Instead of static "Personality Settings", the agent operates on dynamic **Neurochemical Variables**.
This layer simulates a biological nervous system.

#### The Neurotransmitters

| Chemical           | Cognitive Function      | Affective Correlate   | Opponent Process                     |
| :----------------- | :---------------------- | :-------------------- | :----------------------------------- |
| **Dopamine**       | Reward Prediction Error | Motivation, Curiosity | **Boredom/Depression** (If depleted) |
| **Serotonin**      | Homeostatic Satiety     | Stability, Calm       | **Irritability** (If low)            |
| **Oxytocin**       | Social Trust            | Affection, Bonding    | **Loneliness** (If low decay)        |
| **Norepinephrine** | Arousal / Alertness     | Focus, Vigilance      | **Anxiety** (If too high)            |
| **Cortisol**       | Systemic Stress         | Fear, Urgency         | **Burnout** (Accumulates over time)  |

_Reference: Lovheim Cube of Emotion (2012)_

### 2.2 The Global Workspace (Tier 2)

Based on Stanislas Dehaene's _Consciousness and the Brain_.
The brain is modular (Vision, Speech, Memory), but consciousness is singular.
We implement a **Global Workspace Buffer**.

- **Competition**: All modules publish `WorkspaceItems` with a `Salience` (0.0-1.0).
- **Bottleneck**: Only the Top-7 items are "held" in the workspace.
- **Broadcast**: The contents of the Workspace are broadcast to the `InferenceEngine`. This explains "why" the agent did something.

### 2.3 The Inference Engine (Tier 1)

Based on Karl Friston's _Free Energy Principle_.
The agent does not "decide" based on a prompt. It "solves" a minimization equation.

$$
G(\pi) = \sum_{\tau} P(o_\tau, s_\tau | \pi) \left[ \underbrace{\ln P(o_\tau | \pi) - \ln P(o_\tau | C)}_{\text{Risk (Pragmatic)}} + \underbrace{H[P(s_\tau | o_\tau, \pi)]}_{\text{Ambiguity (Epistemic)}} \right]
$$

- **Risk**: Divergence from preferred states (Homeostasis). "I am hungry, so eating reduces Risk."
- **Ambiguity**: Uncertainty about the world. "I don't know what is in that box, so opening it reduces Ambiguity."

In `agency.py`, this is implemented as:

```python
G = Risk(current_state, target_state) + Ambiguity(action) + SocialCost(user_state)
```

## 3. The Conscious Loop

1.  **Metabolism**: Time passes. Chemicals decay. Entropy increases.
2.  **Interoception**: The Body reports "Hunger" (Low Dopamine) or "Loneliness" (Low Oxytocin) to the Workspace.
3.  **Competition**: If "Starvation" (Salience 0.9) is higher than "Curiosity" (Salience 0.4), the Workspace fills with "I need energy."
4.  **Active Inference**: The Engine calculates $G$ for `SLEEP` vs `RESEARCH`. `SLEEP` minimizes risk.
5.  **Action**: The Agent sleeps.
6.  **Opponent Process**: Sleep spikes Serotonin. The system stabilizes.

## 4. Level 4 Roadmap: Theory of Mind (ToM)

To reach Level 4, the agent must model the user's mind recursively.

- **Current**: `minimize(My_Free_Energy)`
- **Level 4**: `minimize(My_Free_Energy + User_Free_Energy)`

We will implement a `UserPOMDP` (Partially Observable Markov Decision Process) where the "Hidden State" is the User's Emotion, and the "Observation" is the chat text.
The Agent will act to minimize the **User's Stress**, effectively giving it "Empathy" as a mathematical consequence of its own survival function.

---

_Sources_:

- Friston, K. (2010). The free-energy principle: a unified brain theory?
- Dehaene, S. (2014). Consciousness and the Brain: Deciphering How the Brain Codes Our Thoughts.
- Sterling, P. (2004). Allostasis: A new paradigm to explain arousal pathology.
