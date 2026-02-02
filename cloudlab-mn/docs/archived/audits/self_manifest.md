
# Sovereign Self-Manifest (2026-01-11T06:24:14.231270+00:00)

## I. Instinctual Capabilities (The Body)
### Reflexes (src/instinct)
- **main.py**:
  - Class `InstinctOS`: shutdown
  - Function `main`
- **base.py**:
  - Class `MotorEffector` - Interface for Motor Output.: 
- **voice.py**:
  - Class `VoiceActuator`: shutdown
- **base.py**:
  - Class `ReflexMechanism` - Interface for a Reflex Mechanism.: 
- **safe_mode.py**:
  - Class `SafeModeReflex` - The autonomic nervous system fallback.: engage
- **audio.py**:
  - Class `AuditoryCortex`: shutdown
- **vision.py**:
  - Class `VisualCortex`: shutdown

## II. Cognitive Capabilities (The Mind)
### Logic (src/cognition)
- **main.py**:
  - Class `ArchitectOS`: shutdown
  - Function `main`
- **critic.py**:
  - Class `Critique`: 
  - Class `Critic` - The 'Reflective Critic'.: 
- **explorer.py**:
  - Class `Explorer` - The 'Novelty Seeker'.: 
- **consolidator.py**:
  - Class `Consolidator` - The 'Hippocampal Replay' Engine.: 
- **sentinel.py**:
  - > Module Doc: The Proactivity Sentinel (The Dreamer's Heartbeat).
  - Class `SentinelDaemon` - Watches the user. Triggers dreams. Use .start() to begin daemon.: tick_interaction, is_idle, is_deep_sleep_candidate
- **pipeline.py**:
  - Class `EvolutionPipeline` - The Prometheus Protocol Implementation.: 
- **awareness.py**:
  - Class `SelfAwareness`: 
- **sglang_worker.py**:
  - Class `SGLangWorker` - A worker that connects to an SGLang runtime to perform structured: 
- **speculation_engine.py**:
  - Class `SpeculationEngine` - Implements a 'speculation engine' that uses a small, fast model ('instinct'): 
- **verification.py**:
  - Class `VerificationEngine` - CHAIN OF VERIFICATION (CoVe) MIDDLEWARE: 
- **cypher_generator.py**:
  - Class `CypherGenerator` - NATIVE CYPHER DRIVER (2026 FRONTIER): 
- **narrative.py**:
  - Class `NarrativeMemory` - Connects to a FalkorDB instance and provides methods for interacting with the graph.: ingest_update, query, add_node, add_edge
- **reflexive.py**:
  - Class `ReflexiveMemory` - Connects to a LanceDB database and provides methods for vector search.: create_table, add, search
- **service.py**:
  - Class `Scribe`: init_log, log_thought, read_scratchpad, write_scratchpad

## III. Kernel Definitions (The Soul)
### Kernel (src/kernel)
- **chronos.py**:
  - > Module Doc: The Chronos Protocol: Temporal Grounding System
  - Class `Chronos` - The Timekeeper Node.: now, get_temporal_context, load_manifest
- **gateway.py**:
  - > Module Doc: The Sovereign Gateway (Bicameral Interface)
  - Class `SovereignClient` - The interface that wraps raw Model I/O with Sovereign constraints.: 
- **logger.py**:
  - Function `setup_logging` - Configures structlog for structured logging.
  - Function `get_logger` - Returns a configured logger instance.
- **messages.py**:
  - > Module Doc: Sovereign Data Contracts (The Wire Protocol)
  - Class `ReflexArc` - High-Frequency Sensory Telemetry.: 
  - Class `AlertPacket` - Critical System Failure / Wake-Word Detection.: 
  - Class `MotorGate` - Motor Override Command.: 
  - Class `GraphUpdate` - Narrative Memory Injection.: 
- **service_discovery.py**:
  - > Module Doc: Service Discovery (Kernel)
  - Function `set_mesh_instance`
  - Function `get_mesh_instance`
- **zenoh_bridge.py**:
  - Class `ZenohMesh` - A class to manage the connection to the Zenoh mesh network. It provides: put, put_bytes, subscribe, subscribe_bytes, query, close
        