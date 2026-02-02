# Emily Coolify Stacks

Consolidated Docker stacks for Emily's multi-site architecture, managed by Coolify.

## Architecture

```
Utah CloudLab (Tesla P4, 8GB)     Minnesota (RTX 4090, 24GB)
┌─────────────────────────────┐   ┌─────────────────────────────┐
│ utah-core                   │   │ minnesota-lfm               │
│ ├── Ollama (LLM inference)  │   │ ├── LFM-Audio (bf16)        │
│ ├── Valkey/FalkorDB (mem)   │   │ ├── LFM-Vision (bf16, dual) │
│ ├── Graphiti (knowledge)    │   │ └── LFM-Thinking (bf16)     │
│ └── Open WebUI (chat)       │   └─────────────────────────────┘
│                             │              ▲
│ utah-embodiment             │              │ RPC/Redis
│ ├── Kokoro TTS              │              │
│ ├── LFM-Audio (INT8)◄───────┼──────────────┘ (failover)
│ ├── LFM-Vision (INT8)       │
│ └── LFM-Thinking (INT8)     │
└─────────────────────────────┘
```

## Stacks

| Stack | Site | Description | VRAM Usage |
|-------|------|-------------|------------|
| `utah-core` | Utah | Emily's brain (Ollama, Valkey, Graphiti, WebUI) | ~4GB |
| `utah-embodiment` | Utah | Sensory fallback (TTS, LFM INT8 quantized) | ~6GB |
| `minnesota-lfm` | Minnesota | Primary LFM models (bf16 full quality) | ~11GB |

## Deployment via Coolify

### 1. Utah Coolify (http://100.64.0.1:8000)

```bash
# Create sovereign-net if not exists
docker network create sovereign-net

# Deploy utah-core stack
cd stacks/utah-core
docker compose up -d

# Deploy utah-embodiment stack
cd ../utah-embodiment
docker compose up -d
```

Or import via Coolify UI:
1. Go to Projects → Add Stack
2. Select "Docker Compose" source
3. Paste contents of docker-compose.yaml
4. Configure environment variables
5. Deploy

### 2. Minnesota Coolify

```bash
# Create emily-net if not exists
docker network create emily-net

# Deploy minnesota-lfm stack
cd stacks/minnesota-lfm
docker compose up -d
```

## Environment Variables

Required in each stack's `.env`:

```bash
# All stacks
HF_TOKEN=hf_xxx  # HuggingFace token for LFM models

# utah-core only
OPENROUTER_API_KEY=sk-or-v1-xxx  # For Graphiti entity extraction
```

## Network Configuration

Both sites communicate via Tailscale:
- Utah: `100.64.0.1` (emily-core-ut)
- Minnesota: `100.64.0.2` (minnesota-training)

Redis/Valkey on Utah (`100.64.0.1:6379`) handles:
- EventBus for cross-site events
- RPC request/response channels

## Failover Behavior

The load balancer in `ens-core` automatically:
1. Tries Minnesota (4090) first for LFM requests
2. Falls back to Utah (P4) if Minnesota is unavailable
3. Health checks run every 5 seconds
4. DEEP vision mode only available on Minnesota

## Service Ports

| Service | Utah Port | Minnesota Port | Purpose |
|---------|-----------|----------------|---------|
| Ollama | 11434 | - | LLM inference |
| Valkey | 6379 | - | Memory/Graph |
| Graphiti | 8010 | - | Knowledge API |
| Open WebUI | 3000 | - | Chat UI |
| Kokoro TTS | 8890 | - | Text-to-Speech |
| LFM-Audio | 8892 | 8892 | Speech-to-Speech |
| LFM-Vision | 8893 | 8893 | Vision-Language |
| LFM-Thinking | 8894 | 8894 | Edge Reasoning |
