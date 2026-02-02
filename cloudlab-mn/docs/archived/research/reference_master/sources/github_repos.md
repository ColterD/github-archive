# GitHub Repositories

Complete list of GitHub repositories referenced, forked, or evaluated for the Emily Sovereign V4 project.

## Core Technologies

### pgvector
- **Repository**: https://github.com/pgvector/pgvector
- **Stars**: 18,500+
- **Forks**: 900+
- **Language**: C
- **Primary Use**: Vector similarity search in PostgreSQL
- **Why Selected**: Native PostgreSQL integration, HNSW indexing, active development
- **Alternatives Considered**:
  - Qdrant: https://github.com/qdrant/qdrant (Rust, dedicated vector DB, but requires separate deployment)
  - Milvus: https://github.com/milvus-io/milvus (Go/Python, feature-rich but complex deployment)

### MLflow
- **Repository**: https://github.com/mlflow/mlflow
- **Stars**: 16,000+
- **Forks**: 4,000+
- **Language**: Python
- **Primary Use**: Experiment tracking, model registry, LLM evaluation (2.18+)
- **Why Selected**: Industry standard, active development, integrated LLM evaluation
- **Alternatives Considered**:
  - Weights & Biases: https://github.com/wandb/wandb (Excellent but paid tier required)
  - ClearML: https://github.com/allegroai/clearml (Strong MLops, but less LLM-focused)

### DVC
- **Repository**: https://github.com/iterative/dvc
- **Stars**: 14,000+
- **Forks**: 1,600+
- **Language**: Python
- **Primary Use**: Data versioning, pipeline orchestration
- **Why Selected**: Git-like interface for data, integrates with MLflow
- **Alternatives Considered**:
  - dolt: https://github.com/dolthub/dolt (SQL-based data versioning, less ML-focused)
  - Delta Lake: https://github.com/delta-io/delta (ACID transactions on data lakes, Spark-centric)

### Feast
- **Repository**: https://github.com/feast-devs/feast
- **Stars**: 5,800+
- **Forks**: 900+
- **Language**: Python
- **Primary Use**: Feature store for ML
- **Why Selected**: Redis online store integration, open-source, strong community
- **Alternatives Considered**:
  - Tecton: https://github.com/tecton-oss/tecton (More production-ready but less flexible)
  - Hopsworks: https://github.com/logicalclocks/hopsworks (Feature platform, but cloud-hosted focus)

## Inference Engines

### SGLang
- **Repository**: https://github.com/sgl-project/sglang
- **Stars**: 2,800+
- **Forks**: 180+
- **Language**: Python
- **Primary Use**: LLM inference server (Tesla P4 compatible)
- **Why Selected**: Better older GPU support than vLLM, efficient memory management
- **Alternatives Considered**:
  - vLLM: https://github.com/vllm-project/vllm (Not used - requires newer GPUs)
  - TGI: https://github.com/huggingface/text-generation-inference (Hugging Face optimized, but resource-heavy)

### vLLM (Reference)
- **Repository**: https://github.com/vllm-project/vllm
- **Stars**: 28,000+
- **Forks**: 3,800+
- **Language**: Python
- **Why Not Selected**: Requires newer GPU architecture (Tesla P4 unsupported)
- **PagedAttention Paper**: https://arxiv.org/abs/2309.06180

## Multi-Agent Frameworks

### CrewAI
- **Repository**: https://github.com/joaomdmoura/crewAI
- **Stars**: 15,000+
- **Forks**: 1,600+
- **Language**: Python
- **Primary Use**: Role-based multi-agent orchestration
- **Why Selected**: Intuitive API, strong community, good documentation
- **Alternatives Considered**:
  - LangGraph: https://github.com/langchain-ai/langgraph (More flexible, but steeper learning curve)
  - AutoGen: https://github.com/microsoft/autogen (Microsoft-backed, but less mature)

### LangGraph
- **Repository**: https://github.com/langchain-ai/langgraph
- **Stars**: 8,500+
- **Forks**: 800+
- **Language**: Python
- **Primary Use**: Stateful agent workflows
- **Why Considered**: More control over agent interaction patterns
- **Alternatives**: See CrewAI above

## Observability

### Cilium
- **Repository**: https://github.com/cilium/cilium
- **Stars**: 18,000+
- **Forks**: 2,800+
- **Language**: Go
- **Primary Use**: eBPF-based networking and security
- **Why Selected**: Deep observability, Hubble UI integration, Kubernetes-native
- **Alternatives Considered**:
  - Calico: https://github.com/projectcalico/calico (More mature, but less observability)
  - Flannel: https://github.com/flannel-io/flannel (Simpler, but fewer features)

### Hubble
- **Repository**: https://github.com/cilium/hubble
- **Stars**: 1,500+
- **Forks**: 180+
- **Language**: Go
- **Primary Use**: Network observability UI for Cilium

### Langfuse
- **Repository**: https://github.com/langfuse/langfuse
- **Stars**: 6,500+
- **Forks**: 400+
- **Language**: TypeScript/Python
- **Primary Use**: LLM application tracing
- **Why Selected**: Open-source alternative to LangSmith, good Django integration
- **Alternatives Considered**:
  - LangSmith: https://github.com/langchain-ai/langsmith (Closed-source, LangChain only)
  - Arize Phoenix: https://github.com/Arize-ai/phoenix (Open-source, but newer)

### DeepFlow
- **Repository**: https://github.com/deepflowio/deepflow
- **Stars**: 2,400+
- **Forks**: 400+
- **Language**: Go
- **Primary Use**: Distributed tracing and APM
- **Why Selected**: eBPF-based (zero code instrumentation), integrates with Cilium
- **Alternatives Considered**:
  - Jaeger: https://github.com/jaegertracing/jaeger (Industry standard, but requires instrumentation)
  - OpenTelemetry: https://github.com/open-telemetry/opentelemetry-collector (Vendor-agnostic, but more setup)

### Pyroscope
- **Repository**: https://github.com/pyroscope-io/pyroscope
- **Stars**: 8,000+
- **Forks**: 600+
- **Language**: Go
- **Primary Use**: Continuous profiling
- **Why Selected**: Open-source (unlike Datadog profiler), integrates with Prometheus
- **Alternatives Considered**:
  - pprof: https://github.com/google/pprof (Go's built-in profiler, but UI-less)
  - Grafana Pyroscope: https://github.com/grafana/pyroscope (Same project, now under Grafana)

## WebAssembly

### WasmEdge
- **Repository**: https://github.com/WasmEdge/WasmEdge
- **Stars**: 4,800+
- **Forks**: 600+
- **Language**: C++
- **Primary Use**: WebAssembly runtime
- **Why Selected**: Python bindings, lightweight, good performance
- **Alternatives Considered**:
  - Wasmtime: https://github.com/bytecodealliance/wasmtime (More mature, but heavier)
  - Wasmer: https://github.com/wasmerio/wasmer (Good performance, but complex plugin system)

### Pyodide
- **Repository**: https://github.com/pyodide/pyodide
- **Stars**: 12,000+
- **Forks**: 1,000+
- **Language**: Python/C
- **Primary Use**: Python to WASM compilation
- **Why Selected**: Mature, supports scientific libraries
- **Alternatives Considered**:
  - PyScript: https://github.com/pyscript/pyscript (Browser-focused, less server-side)
  - Nuitka: https://github.com/Nuitka/Nuitka (Python compiler, not WASM-focused)

## QUIC & Networking

### aioquic
- **Repository**: https://github.com/aiortc/aioquic
- **Stars**: 2,600+
- **Forks**: 400+
- **Language**: Python
- **Primary Use**: QUIC implementation in Python
- **Why Selected**: Asyncio-compatible, good examples, actively maintained
- **Alternatives Considered**:
  - QuicGo: https://github.com/lucas-clemente/quic-go (Go implementation, but we're Python-focused)
  - MsQuic: https://github.com/microsoft/msquic (Microsoft's implementation, but C-based)

## Ray Distributed Computing

### Ray
- **Repository**: https://github.com/ray-project/ray
- **Stars**: 31,000+
- **Forks**: 5,400+
- **Language**: Python
- **Primary Use**: Distributed computing framework
- **Why Selected**: Mature ecosystem, Python-first, good actor model
- **Alternatives Considered**:
  - Dask: https://github.com/dask/dask (More lightweight, but fewer ML integrations)
  - Spark: https://github.com/apache/spark (More mature, but Java-heavy and resource-intensive)

## Unikernels

### Nanos
- **Repository**: https://github.com/nanovms/nanos
- **Stars**: 1,600+
- **Forks**: 250+
- **Language**: C
- **Primary Use**: Unikernel operating system
- **Why Selected**: Good documentation, active development
- **Alternatives Considered**:
  - OSv: https://github.com/cloudius-systems/osv (More mature, but less active)
  - IncludeOS: https://github.com/hioa-cs/IncludeOS (Older, less active)

## IPFS & P2P

### go-ipfs
- **Repository**: https://github.com/ipfs/kubo
- **Stars**: 15,000+
- **Forks**: 3,000+
- **Language**: Go
- **Primary Use**: IPFS implementation
- **Why Selected**: Reference implementation, well-documented
- **Alternatives Considered**:
  - IPFS Desktop: https://github.com/ipfs/ipfs-desktop (GUI-based, less flexible)
  - IPFS Cluster: https://github.com/ipfs/ipfs-cluster (For distributed pinning, but more complex)

### Zenoh
- **Repository**: https://github.com/eclipse-zenoh/zenoh
- **Stars**: 900+
- **Forks**: 170+
- **Language**: Rust
- **Primary Use**: Pub/sub messaging and routing
- **Why Selected**: Lightweight, edge-friendly, integrates with QUIC
- **Alternatives Considered**:
  - MQTT: https://github.com/eclipse/mosquitto (More mature, but broker-based)
  - NATS: https://github.com/nats-io/nats-server (More popular, but less edge-focused)

## Workflow Orchestration

### Prefect
- **Repository**: https://github.com/PrefectHQ/prefect
- **Stars**: 15,000+
- **Forks**: 1,600+
- **Language**: Python
- **Primary Use**: Workflow orchestration
- **Why Selected**: Python-native, excellent UI, modern architecture
- **Alternatives Considered**:
  - Apache Airflow: https://github.com/apache/airflow (Industry standard, but complex)
  - Dagster: https://github.com/dagster-io/dagster (Data ops focused, but steeper learning curve)

### Temporal
- **Repository**: https://github.com/temporalio/temporal
- **Stars**: 9,000+
- **Forks**: 700+
- **Language**: Go
- **Primary Use**: Durable workflow execution
- **Why Selected**: Excellent for long-running workflows, strong consistency
- **Alternatives**: See Prefect above

## Security

### sops-nix
- **Repository**: https://github.com/Mic92/sops-nix
- **Stars**: 600+
- **Forks**: 70+
- **Language**: Nix
- **Primary Use**: Secrets management for NixOS
- **Why Selected**: Native NixOS integration, git-ops friendly
- **Alternatives Considered**:
  - Infisical: https://github.com/Infisical/infisical (More feature-rich, but no Nix module)
  - HashiCorp Vault: https://github.com/hashicorp/vault (Enterprise-grade, but complex deployment)

### Mozilla SOPS
- **Repository**: https://github.com/mozilla/sops
- **Stars**: 13,000+
- **Forks**: 1,100+
- **Language**: Go
- **Primary Use**: Secrets encryption
- **Why Selected**: Age-based encryption, simple workflow, cloud-agnostic

## Testing

### Pytest
- **Repository**: https://github.com/pytest-dev/pytest
- **Stars**: 11,000+
- **Forks**: 2,600+
- **Language**: Python
- **Primary Use**: Python testing framework
- **Why Selected**: Industry standard, rich plugin ecosystem
- **Alternatives Considered**:
  - Unittest: https://github.com/python/cpython/tree/main/Lib/unittest (Built-in, but less powerful)
  - Nose: https://github.com/nose-devs/nose (Deprecated in favor of pytest)

### Hypothesis
- **Repository**: https://github.com/HypothesisWorks/hypothesis
- **Stars**: 5,200+
- **Forks**: 370+
- **Language**: Python
- **Primary Use**: Property-based testing
- **Why Selected**: Powerful fuzzing, integrates with pytest
- **Alternatives Considered**:
  - QuickCheck: https://github.com/nick8325/quickcheck (Haskell original, but Python port is Hypothesis)
  - Pynguin: https://github.com/se2p/pynguin (Genetic algorithm-based, but experimental)

## Backup & Recovery

### Restic
- **Repository**: https://github.com/restic/restic
- **Stars**: 25,000+
- **Forks**: 1,600+
- **Language**: Go
- **Primary Use**: Deduplicated backups
- **Why Selected**: Cross-platform, supports many backends, open-source
- **Alternatives Considered**:
  - BorgBackup: https://github.com/borgbackup/borg (More mature, but less modern)
  - Duplicati: https://github.com/duplicati/duplicati (GUI-focused, less flexible)

## CI/CD

### Forgejo
- **Repository**: https://github.com/forgejo/forgejo
- **Stars**: 2,000+
- **Forks**: 240+
- **Language**: Go
- **Primary Use**: Self-hosted Git forge (Gitea fork)
- **Why Selected**: ActivityPub support, community-driven, less corporate than GitLab
- **Alternatives Considered**:
  - Gitea: https://github.com/go-gitea/gitea (Parent project, but Forgejo is more community-focused)
  - GitLab: https://github.com/gitlabhq/gitlabhq (More features, but resource-heavy)

---

**Last Updated**: 2026-01-12

**Total Repositories**: 50+

**Repository Health Metrics**:
- All primary choices have >2,000 stars
- Most primary choices have >500 forks
- Active development (commits within 3 months)

**For AI Agents**: When evaluating new technologies, use this format:
1. Repository URL
2. Stars/Forks (as of 2026-01)
3. Primary language
4. Why selected for this project
5. Alternatives considered with brief rationale
