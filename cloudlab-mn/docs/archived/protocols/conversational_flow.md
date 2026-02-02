# CONVERSATIONAL FLOW PROTOCOL: "THE INTERWOVEN TURN"

> **Date:** January 2026
> **Objective:** Eliminate the "Walkie-Talkie" effect. Replace simple Silence VAD with predictive "Projection".
> **Target:** < 200ms Turn-Taking Latency (Human perception threshold).

## 1. THE PROBLEM: REACTIVE VS. PROJECTIVE

Current VAD is **Reactive**: It waits for silence to _confirm_ the turn is over.

- _User stops speaking_ -> [Silence 800ms] -> _Emily realizes turn is over_ -> Start Processing.
- **Total Latency:** 800ms (VAD) + 500ms (Network) = 1.3s (awkward pause).

New VAD must be **Projective**: It bets the turn is ending _while_ the user is finishing.

- _User:_ "...and that's the plan." (Falling pitch, slowing rhythm)
- _Emily:_ "Got it." (Starts speaking immediately at silence onset, or slightly overlapping).

---

## 2. ARCHITECTURE: THE "INTERVIEWER" MODEL

We introduce a lightweight, local model running on the **P4 (Instinct)** specifically for turn management.

**Model Checkpoints:** `turn_gpt_v2_small.onnx` (Quantized, ~80MB)

### Inputs

1.  **Audio Stream (Mel-spec):** Last 3 seconds.
2.  **Prosodic Features (Real-time):** Pitch (F0) slope, Energy flux, Speech rate.
3.  **Semantic Context (Rolling Buffer):** Last 3 words (if STT is fast enough) or Phoneme sequence.

### Outputs (Probabilities at 20Hz)

1.  `P(TRP)`: Transition Relevance Place (Is the user done?)
2.  `P(BC)`: Backchannel Opportunity (Should I say "Mhm"?)
3.  `P(HOLD)`: Floor Holding (Is the user thinking/pausing but wants to keep talking?)

---

## 3. PROTOCOL STATES & LOGIC

### A. End-of-Turn (EOT) Prediction

Instead of a fixed silence threshold, we use a dynamic threshold modulated by `P(TRP)`.

- **High Confidence EOT (`P(TRP) > 0.85`):**
  - _Trigger:_ Falling intonation + Syntactic completion.
  - _Action:_ **VAD Threshold drops to 50ms.**
  - _Result:_ Emily replies almost instantly.
- **Low Confidence / User Thinking (`P(HOLD) > 0.7`):**
  - _Trigger:_ Dragged vowels ("Umm...", "So then..."), flat pitch.
  - _Action:_ **VAD Threshold raises to 1500ms.**
  - _Result:_ User can pause for breath without being interrupted.

### B. Backchanneling (Continuous Dialogue)

We do not wait for the user to stop to show we are listening.

- **Condition:** User has held floor > 3s AND `P(BC) > 0.6` AND `Silence > 100ms`.
- **Action:**
  - **NO STT/LLM CALL.** This is purely the Instinct brain.
  - Select from `assets/audio/backchannels/`: { "mhm_neutral.wav", "yeah_upbeat.wav", "right_soft.wav" }.
  - Play audio on `Background_Layer` (do not duck user audio).

### C. Barge-In Handling (The "Yield" Protocol)

Handling when the user interrupts _Emily_.

**State: Emily is Speaking.**

1.  **Detection:** User Audio Power > `Noise_Floor + 10dB`.
2.  **Immediate Reflex (0ms - 50ms):**
    - **HARD DUCK:** Drop Emily's TTS volume by 80%. _Do not stop yet._
3.  **Classification (50ms - 300ms):**
    - Analyze the user's interruption.
    - **Case 1: Agreement/Backchannel** ("Yeah", "Exactly", "Uh-huh").
      - _Action:_ Restore Emily's volume over 200ms. Continue speaking.
    - **Case 2: Active Interrupt** ("Wait", "No", "Stop", "Hey").
      - _Action:_ **KILL TTS.** Clear buffer.
      - _State:_ Revert to Listening.
      - _Memory:_ Note the interruption in short-term context ("User cut off explanation about X").

---

## 4. IMPLEMENTATION ROADMAP

### Phase 1: Data Collection & Calibration

- Record user sessions to establish baseline `P(TRP)` accuracy.
- Tune "Hard Duck" vs "Stop" thresholds.

### Phase 2: The "Instinct" Logic Integration

Integrate into `src/instinct/`.

```python
# src/instinct/flow_controller.py

class FlowState(Enum):
    LISTENING = 1
    SPEAKING = 2
    BACKCHANNELING = 3
    YIELDING = 4

class ConversationalFlowManager:
    def __init__(self):
        self.vad_threshold = 0.8  # Dynamic
        self.silence_timeout = 700 # Dynamic ms

    def on_audio_frame(self, frame_features):
        p_trp, p_bc, p_hold = self.projection_model.predict(frame_features)

        # 1. Dynamic VAD Adjustment
        if p_trp > 0.8:
            self.silence_timeout = 50   # Aggressive turn-taking
        elif p_hold > 0.7:
            self.silence_timeout = 1500 # Patient listener

        # 2. Backchannel Trigger
        if p_bc > 0.75 and self.current_silence > 100:
            self.trigger_reflex("mhm")

    def on_interruption(self, interrupt_audio):
        classification = self.classifier.classify_quick(interrupt_audio)
        if classification == "AGREEMENT":
            self.audio_mixer.unduck()
        else:
            self.audio_mixer.stop_tts()
            self.brain.reorient()
```

### Phase 3: Assets

- Synthesize/Record 20 variations of backchannels ("Mhm", "Ah", "Okay", "Right").
- Classify them by Sentiment (Neutral, Agreeing, Surprised).
