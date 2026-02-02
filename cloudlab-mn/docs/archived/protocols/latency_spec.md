# EMILY: Speculative Latency Protocol (SLP-2026)

**Objective:** Reduce Time-to-First-Token (TTFT) for _meaningful_ audio from ~2500ms (Cloud) to <500ms (Local), maintaining Cloud-level intelligence.
**Strategy:** Move from "Hiding Latency" (Fillers) to "Gambling on Latency" (Speculative Execution).

---

## 1. Remote Speculation (The "Lookahead" Bridge)

We invert the standard Speculative Decoding relationship. Instead of a small draft model accelerating a large local model, the **Local P4 (Instinct)** drafts for the **Cloud API (Cognition)** across the network.

### The Protocol

1.  **User Query:** "What is the fastest bird?"
2.  **Instinct (P4-3B) starts generating immediately:**
    - _Draft:_ "The fastest bird is the Peregrine Falcon." (Tokens: `[The, fastest, bird, is... Falcon]`)
    - _Latency:_ 40ms/token. Total ~500ms for 12 tokens.
3.  **Transmission:** The Instinct sends the **Prompt + Draft Tokens** to the Cloud API as a "hint".
4.  **Cognition (GLM-4.7) Verification:**
    - The Cloud model processes the prompt.
    - It performs a parallel forward pass on the Draft Tokens (checking all at once, not auto-regressively).
    - **Hit:** It accepts tokens 1-8.
    - **Miss:** It rejects token 9.
5.  **Return:** Cloud returns: "Accept 8. Next is [diving]."

### Bandwidth Efficiency

- Uploading 20 integer token IDs adds negligible latency (<5ms) compared to the inference time gain.
- **Result:** The Cloud response seems to "jump" forward by 8-10 words instantly upon connection establishment.

---

## 2. Optimistic TTS (The "Trust Fall")

We do not wait for the Cloud to verify the tokens. We speak the Draft.

### The "Confidence Gate"

The TTS Engine (`senses/tts`) subscribes to the **Instinct Draft Stream**, not the Cloud Stream.

- **Rule:** If `P4_Token_LogProb > CONFIG.TRUST_THRESHOLD` (e.g., 0.85), send to TTS buffer immediately.
- **Latency:** Audio output begins at ~200ms (Processing + TTS Generation).

### The "Verbal Backspace" (Correction Mechanism)

What happens when the generic Instinct (3B) is wrong and the distinct Cognition (100B) rejects it?

- _Draft (Instinct):_ "The capital of Australia is **Sydney**." (Speaking...)
- _Verify (Cloud):_ REJECT at "Sydney". Correct: "Canberra".
- **The Glitch Protocol:**
  1.  **Interrupt:** The Audio Mixer hard-cuts the current TTS buffer.
  2.  **Disfluency Injection:** Insert a microsample of a "realization" sound: `uh_wait.wav` or `tsk_actually.wav`.
  3.  **Resume:** TTS resumes exclusively from the Cloud's correct token stream.
- **User Experience:** "The capital of Australia is Syd- _uh, actually_ Canberra."
  - _Psychology:_ This mimics human error/correction patterns. It makes Emily seem _more_ natural, not less, transforming a system failure into an anthropomorphic feature.

---

## 3. Skeleton-of-Thought (The "Bone Conducting" Protocol)

Used for complex, multi-step reasoning where the P4 cannot accurately draft the prose (e.g., coding, nuanced advice).

### The Flow

1.  **User:** "Write a Python script to scan ports."
2.  **Cognition (Cloud) - Skeleton Mode:**
    - Instead of writing code, it generates a structure first:
    - `1. Import socket`
    - `2. Define scan function`
    - `3. Loop ports`
3.  **Instinct (P4) - Expansion Mode:**
    - Receives bullet points instantly (highly compressible).
    - Starts generating the _boilerplate_ code or explaining the logic for Bullet #1 locally while the Cloud is still thinking about the complex implementation details of Bullet #2.
4.  **Convergence:** The streams merge. The user sees/hears the plan immediately, while the complex execution follows.

---

## Architecture Updates Required

### `src/kernel/speculation_engine.py`

- [ ] Implement `DraftGenerator`: P4 generation loop with LogProb exposure.
- [ ] Implement `StreamVerifier`: Compare Cloud stream vs. Local Draft buffer.
- [ ] Implement `CorrectionTrigger`: Signal `senses/audio` to interrupt.

### `src/senses/audio/mixer.py`

- [ ] Add `Interrupt()` method with <20ms latency.
- [ ] Load `disfluency_pack` (wavs) into RAM.
