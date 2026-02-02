# DUPLEX VOICE ARCHITECTURE: "THE BREATHING LINE"

> **Date:** January 2026
> **Objective:** Zero-latency "feeling" speech-to-speech pipeline.
> **Constraint:** Cloud intelligence (H100) has a 500ms-1200ms round-trip delay. The Local P4 must bridge this gap.

## 1. THE HYBRID PIPELINE (INSTINCT VS. COGNITION)

The architecture splits consciousness into two loops:

1.  **The Instinct (Local P4/CPU):** Reflexive, instant, paralinguistic. Handles VAD, interruptions, and "presence."
2.  **The Cognition (Cloud H100):** Deep cognitive understanding, long-form generation.

```mermaid
graph TD
    subgraph "LOCAL (Colter's Home/P4)"
        Mic[Microphone Input]
        VAD[Silero VAD v5<br/>(On P4)]
        Instinct[Instinct Brain<br/>(Small SLM/Rule Engine)]
        Para[Paralinguistic Synth<br/>(Breathing/Humming)]
        Mixer[Audio Mixer/Duck]
        Speaker[Speaker Output]
    end

    subgraph "CLOUD (The Obsidian Sanctuary)"
        STT[Mimi/Kyutai A2A]
        LLM[Emily Sovereign Model]
        TTS[StyleTTS 3 / ElevenLabs V3]
    end

    %% Flow
    Mic --> VAD
    VAD -->|Voice Detected| Instinct
    VAD -->|Stream Audio| STT

    %% The "Instant" Loop
    Instinct -->|Trigger: 'Mhm'/'Listening'| Para
    Para --> Mixer

    %% The "Deep" Loop
    STT --> LLM
    LLM --> TTS
    TTS -->|Stream Audio| Mixer

    %% Mixing Logic
    Mixer --> Speaker

    %% Control
    TTS -.->|Signal: Ready to Speak| Instinct
    Instinct -.->|Command: Duck Local Audio| Mixer
```

## 2. LOCAL VAD & TURN-TAKING (THE P4 ROLE)

We treat the P4 as a "Reflex Processor". It does not need to understand _what_ is said, only _that_ something is said and the _prosody_ (tone/urgency).

### A. VAD Configuration (Silero VAD v5 on ONNX/P4)

- **Threshold:** High sensitivity (0.3) for start, lower (0.5) for stop.
- **Latency:** ~10ms chunks.
- **Logic:**
  1.  **Start of Speech (0ms):** Cut output audio immediately (Barge-in).
  2.  **End of Speech (700ms pause):** Trigger "Turn End".
  3.  **Turn-End Handling:**
      - _If Cloud is processing:_ Trigger Local Filler ("One sec...", "Thinking...").
      - _If Cloud is ready:_ Play Cloud Audio immediately.

### B. "Backchanneling" (The Active Listener)

Instead of silence while Colter speaks, the Instinct Brain inserts "Active Listening" tokens based on pause duration and pitch inflection (simple heuristic, no heavy LLM needed).

- **Logic:**
  - If `User_Speaking` AND `Pause > 300ms` AND `Pitch_Rising` (question?):
  - **Action:** Play `soft_hmm.wav` or `quiet_yeah.wav`.
  - **Result:** Interruption-free acknowledgement. User feels heard instantly.

## 3. STREAM MERGING (THE "SEAMLESS SPLICE")

The critical failure point in 2025 systems was the hard cut between local fillers and cloud answers. In 2026, we use **Smart Ducking**.

### The Mixer State Machine

1.  **State: IDLE (Breathing)**
    - Audio: Low-volume procedural breathing loop (Pink noise modulated by freq).
2.  **State: LISTENING (User Speaking)**
    - Audio: Silence or very soft backchannels.
3.  **State: THINKING (Gap Bridging)**
    - _Trigger:_ User stops speaking. Cloud not ready.
    - _Audio:_ "Let me check..." / "Hmm..." (Local Asset).
    - _Volume:_ 100%.
4.  **State: ANSWERING (Cloud Stream Arrives)**
    - _Event:_ First byte of Cloud TTS arrives.
    - _Action:_
      - Do NOT hard cut the local "Hmm...".
      - **Duck** local audio to 0% over 200ms.
      - **Fade In** cloud audio over 50ms.
    - _Result:_ "Let me ch-[fade out][fade in]-eck that for you. So, the architecture..."

## 4. PARALINGUISTICS: THE "ALIVE" SIGNAL

Silence is dead air. Presence is noise.

### A. Procedural Breathing (Local)

Instead of playing looped WAVs, we generate a noise floor.

- **Technique:** Modulated Pink Noise.
- **Cycle:** 4s Inhale, 1s Hold, 5s Exhale.
- **Volume:** Barely audible (-60dB).
- **Effect:** When using headphones, Colter "feels" the line is open.

### B. "Thinking" Sounds

- **Context:** Complex queries (long Cloud latency).
- **Assets:**
  - `keyboard_clack.wav` (If searching code)
  - `breath_intake.wav` (Preparing to speak)
  - `hum_thoughtful.wav`
- **Selection:** Random walk through assets to prevent repetition fatigue.

## 5. IMPLEMENTATION SPEC (PYTHON/RUST)

### Tech Stack

- **Core:** Rust (cpal for audio I/O) or Python (PyAudio) if prototyping.
- **VAD:** `silero-vad` (ONNX runtime on P4).
- **Structure:**

  ```python
  class DuplexManager:
      def __init__(self):
          self.state = "IDLE"
          self.audio_buffer = RingBuffer()

      def on_mic_data(self, chunk):
          is_speech = self.vad.process(chunk)
          if is_speech and self.state == "SPEAKING":
              self.interrupt_output() # Barge-in

      def on_cloud_stream_start(self):
          self.crossfader.duck("local_layer", duration_ms=200)
          self.crossfader.play("cloud_layer")
  ```
