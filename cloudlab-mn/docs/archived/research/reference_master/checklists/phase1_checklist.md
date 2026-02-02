# Phase 1 Checklist

Verification checklist for Phase 1: Foundation - Observability, Vector DB, Inference, Multi-Agent completion.

## Observability Setup

### Cilium & Hubble
- [ ] Cilium installed via NixOS
- [ ] Cilium CRD configurations applied
- [ ] Cilium pods running (kubectl get pods -n kube-system)
- [ ] Hubble UI accessible (localhost:8123)
- [ ] Hubble flows visible (real-time network visibility)
- [ ] Hubble policies configured (allow/deny rules)
- [ ] Cilium BPF programs loaded successfully
- [ ] Network policies tested (ping, HTTP, etc.)
- [ ] Cilium health checks passing (cilium status)

### Langfuse
- [ ] Langfuse server installed (Python + dependencies)
- [ ] Langfuse database created (PostgreSQL)
- [ ] Langfuse Python SDK installed
- [ ] Langfuse API key generated (for SDK authentication)
- [ ] Langfuse server started (systemd service)
- [ ] Langfuse UI accessible (localhost:3000)
- [ ] LLM application instrumented (tracing enabled)
- [ ] Token usage tracking verified
- [ ] Latency metrics captured
- [ ] Cost tracking verified

### DeepFlow
- [ ] DeepFlow server installed
- [ ] DeepFlow agents installed on all nodes
- [ ] DeepFlow dashboard accessible
- [ ] Distributed tracing enabled
- [ ] Auto-discovery of services working
- [ ] eBPF instrumentation verified (zero-code)
- [ ] DeepFlow metrics exported to Prometheus
- [ ] Service map generated (application topology)
- [ ] Trace retention configured (7 days)

### Pyroscope
- [ ] Pyroscope server installed
- [ ] Pyroscope agent installed on application server
- [ ] Pyroscope dashboard accessible (localhost:4040)
- [ ] Continuous profiling enabled
- [ ] Flame graphs generating
- [ ] Performance bottlenecks identified (if any)
- [ ] Profile retention configured (7 days)
- [ ] Pyroscope integration with Prometheus verified

### Prometheus & Grafana
- [ ] All observability targets added to Prometheus scrape config
- [ ] Prometheus relabeling configured (proper metric naming)
- [ ] Prometheus alert rules created
- [ ] Grafana dashboards created for:
  - [ ] Cilium/Hubble network metrics
  - [ ] Langfuse LLM metrics
  - [ ] DeepFlow tracing metrics
  - [ ] Pyroscope profiling metrics
  - [ ] System metrics (CPU, memory, disk, network)
- [ ] Grafana alerts configured
- [ ] Notification channels tested (Email, Slack, etc.)

## Vector Database (pgvector)

### PostgreSQL + pgvector
- [ ] PostgreSQL 16 installed (NixOS)
- [ ] pgvector extension installed (PGVECTOR_VERSION >= 0.5.0)
- [ ] pgvector enabled in PostgreSQL (CREATE EXTENSION)
- [ ] Database "sovereign" created
- [ ] Table "memories" created with VECTOR column
- [ ] HNSW index created (optimized parameters)
- [ ] Index configuration verified (m=16, ef_construction=64, ef=40)
- [ ] PostgreSQL memory tuned (shared_buffers, work_mem, etc.)
- [ ] PostgreSQL connections limited (max_connections=100)
- [ ] PostgreSQL optimized for CloudLab c220g5 (128GB RAM)

### pgvector Configuration
- [ ] Compression enabled (pgvector settings)
- [ ] Connection pooling configured (PgBouncer or pgbouncer)
- [ ] Query optimization tested (EXPLAIN ANALYZE)
- [ ] Vector dimension verified (768-dim for embedding model)
- [ ] Distance function verified (vector_cosine_ops)
- [ ] Index rebuild tested (performance before/after)
- [ ] Partitioning configured (if >100M vectors expected)

### Vector Search Testing
- [ ] Test vectors inserted (1000+ samples)
- [ ] Search latency measured (target: <20ms for 10 results)
- [ ] Recall accuracy measured (target: >95%)
- [ ] Batch insert performance tested (target: >5000/sec)
- [ ] HNSW parameters tuned (ef adjusted for recall/latency)
- [ ] Concurrent queries tested (10+ parallel)
- [ ] pgvector metrics exported to Prometheus
- [ ] Index size monitored (growth rate)
- [ ] Query performance documented

## Inference Server (SGLang)

### SGLang Installation
- [ ] CUDA 11.8 installed (compatible with Tesla P4)
- [ ] SGLang installed via pip/nix
- [ ] Model downloaded (LLaMA 7B GGUF format)
- [ ] Model quantization verified (Q4_K_M recommended for 8GB VRAM)
- [ ] SGLang server configured (port, host, etc.)
- [ ] SGLang parameters optimized:
  - [ ] mem-fraction-static = 0.9 (90% of 8GB)
  - [ ] max-running-requests = 4 (batch size)
  - [ ] context-length = 4096 (balanced for VRAM)
  - [ ] dtype = float16 (speed)
  - [ ] tp = 1, pp = 1 (single GPU)
- [ ] SGLang systemd service created
- [ ] SGLang server started successfully
- [ ] SGLang health endpoint accessible

### SGLang Testing
- [ ] Inference latency measured (target: <200ms for 7B model)
- [ ] Throughput measured (target: ~8 tokens/s on Tesla P4)
- [ ] VRAM usage monitored (target: <90% of 8GB)
- [ ] Batch processing tested (1, 2, 4, 8 requests)
- [ ] Concurrent requests tested (4+ simultaneous)
- [ ] Error handling verified (invalid requests, OOM recovery)
- [ ] API documentation reviewed (SGLang endpoints)
- [ ] Integration with application tested (HTTP requests)
- [ ] SGLang metrics exported to Prometheus
- [ ] SGLang restart tested (graceful shutdown/startup)

## Multi-Agent Framework (CrewAI)

### CrewAI Installation
- [ ] CrewAI installed via pip/nix
- [ ] CrewAI dependencies installed (langchain, openai, etc.)
- [ ] Agent roles defined (researcher, planner, executor)
- [ ] Agent tasks defined (specific responsibilities)
- [ ] Crew configuration created (team composition)
- [ ] CrewAI integration tested (task execution)
- [ ] Agent communication verified
- [ ] Async support configured (if needed)
- [ ] Memory/context management configured
- [ ] Tool use configured (agents can call functions)

### CrewAI Testing
- [ ] Single agent task execution tested
- [ ] Multi-agent collaboration tested
- [ ] Agent handoff verified
- [ ] Task delegation verified
- [ ] Error recovery tested (agent failure handling)
- [ ] Performance measured (agent overhead)
- [ ] Agent memory tested (context retention)
- [ ] CrewAI metrics logged (if available)

## MLflow Integration

### MLflow Setup
- [ ] MLflow 2.18+ installed (verify version)
- [ ] MLflow tracking server started
- [ ] MLflow database created (PostgreSQL)
- [ ] MLflow UI accessible (localhost:5000)
- [ ] Experiments created (for cognitive module training)
- [ ] Runs tracked (parameters, metrics, artifacts)
- [ ] Models registered (inference models)
- [ ] Model serving configured (if using MLflow serve)
- [ ] LLM evaluation features enabled (2.18+)
- [ ] Evaluation datasets prepared (human preferences, benchmarks)

### MLflow Testing
- [ ] Experiment tracking verified (run parameters logged)
- [ ] Metrics logging verified (accuracy, loss, etc.)
- [ ] Artifacts logged (model weights, configs)
- [ ] Model registry tested (model versioning)
- [ ] LLM evaluation tested (LLM-as-a-judge)
- [ ] Comparison metrics captured (model A vs. model B)
- [ ] MLflow API integration tested
- [ ] MLflow CLI tested (mlflow runs list, etc.)
- [ ] MLflow UI verified (experiment comparison)

## DVC Integration

### DVC Setup
- [ ] DVC installed (Python package)
- [ ] DVC initialized in project repository
- [ ] .dvc/config created (storage backend)
- [ ] DVC remote configured (S3-compatible or local ZFS)
- [ ] Large files tracked with DVC (models, datasets)
- [ ] Git + DVC workflow tested (clone, pull, checkout)
- [ ] DVC cache configured (size, location)
- [ ] DVC pipelines created (if needed)

### DVC Testing
- [ ] Large file tracking verified (model weights, datasets)
- [ ] Data download tested (dvc pull)
- [ ] Data upload tested (dvc push)
- [ ] Versioning tested (switching between DVC versions)
- [ ] Cache hit ratio monitored
- [ ] DVC metrics integrated with MLflow
- [ ] Git workflow verified (Git tracks .dvc files)

## Feast Feature Store

### Feast Setup
- [ ] Feast installed via pip/nix
- [ ] Feast repo initialized (feast init)
- [ ] Feature definitions created ( Feast schema)
- [ ] Redis installed (for online store)
- [ ] PostgreSQL configured (for offline store)
- [ ] Feast store configured (online: Redis, offline: Postgres)
- [ ] Feast feature definitions applied
- [ ] Historical feature data loaded (offline store)
- [ ] Materialized views created (if needed)
- [ ] Feast serving started

### Feast Testing
- [ ] Feature retrieval tested (online store - Redis)
- [ ] Feature retrieval tested (offline store - PostgreSQL)
- [ ] Feature serving latency measured (target: <10ms)
- [ ] Feature versioning tested (time-traveling)
- [ ] Feast Python SDK integration tested
- [ ] Feast CLI tested (feast apply, feast materialize)
- [ ] Feast UI configured (if using Feast UI)
- [ ] Feast metrics exported to Prometheus
- [ ] Feast feature statistics reviewed

## Testing Infrastructure

### Pytest Setup
- [ ] pytest installed (Python package)
- [ ] pytest.ini created (pytest configuration)
- [ ] Test directory structure created (tests/unit, tests/integration, tests/e2e)
- [ ] pytest-cov installed (coverage reporting)
- [ ] Coverage configuration created (.coveragerc)
- [ ] Test dependencies installed (pytest-asyncio, pytest-mock, etc.)
- [ ] pytest markers configured (@unit, @integration, @e2e)
- [ ] Fixtures created (test data, test utilities)

### Pytest Testing
- [ ] Unit tests passing (pytest tests/unit)
- [ ] Integration tests passing (pytest tests/integration)
- [ ] E2E tests passing (pytest tests/e2e)
- [ ] Coverage measured (target: >80%)
- [ ] Coverage report generated (HTML, XML)
- [ ] Parallel test execution configured (pytest-xdist)
- [ ] Test isolation verified (no test dependencies)
- [ ] Mock/stub usage verified (external services mocked)
- [ ] Test timeout configured (pytest-timeout)

### Hypothesis Setup
- [ ] Hypothesis installed (Python package)
- [ ] Property-based tests created
- [ ] Hypothesis strategies configured (for custom data types)
- [ ] Hypothesis settings configured (max_examples, deadline, etc.)
- [ ] Hypothesis shrinking enabled
- [ ] Hypothesis integration with pytest verified

### Hypothesis Testing
- [ ] Property-based tests passing
- [ ] Edge cases discovered (if any)
- [ ] Hypothesis examples explored (test database)
- [ ] Shrinking verified (minimal counterexamples)
- [ ] Hypothesis settings tuned (balance of thoroughness vs. speed)

## Integration Testing

### End-to-End Tests
- [ ] LLM flow tested (prompt → SGLang → embedding → pgvector → retrieval)
- [ ] Multi-agent flow tested (agent A → agent B → result)
- [ ] Data flow tested (raw data → DVC → MLflow → Feast)
- [ ] Monitoring flow tested (Langfuse → DeepFlow → Grafana)
- [ ] Error handling tested (failure scenarios)
- [ ] Performance benchmarks created (end-to-end latency)
- [ ] Integration tests automated (if possible)

## Documentation

### Phase 1 Documentation
- [ ] 01_observability_setup.md complete
- [ ] 02_vector_database_setup.md complete
- [ ] 03_inference_server_setup.md complete
- [ ] 04_multi_agent_framework.md complete
- [ ] 05_mlflow_integration.md complete
- [ ] 06_dvc_integration.md complete
- [ ] 07_feast_feature_store.md complete
- [ ] 08_testing_infrastructure.md complete
- [ ] All example_configurations/ files created
- [ ] runbook_observability.md created
- [ ] troubleshooting_infrastructure.md created
- [ ] README.md updated with Phase 1 status

## Performance Verification

### Benchmarks
- [ ] pgvector query latency: <20ms (10 results)
- [ ] pgvector throughput: ~80 QPS (realistic for CloudLab)
- [ ] SGLang inference latency: <200ms (7B model)
- [ ] SGLang throughput: ~8 tokens/s (Tesla P4)
- [ ] CrewAI agent overhead: <50ms per task
- [ ] End-to-end LLM flow: <500ms (retrieval + generation)
- [ ] Memory usage: <90% VRAM, <100% system RAM

### Observability Coverage
- [ ] Network: 100% (Cilium + Hubble)
- [ ] Application: 100% (Langfuse + DeepFlow)
- [ ] Profiling: 100% (Pyroscope)
- [ ] Metrics: 100% (Prometheus)
- [ ] Dashboards: 100% (Grafana)

## Final Verification
- [ ] All checklist items completed
- [ ] System stable for 24 hours post-setup
- [ ] No critical errors in logs
- [ ] All services running correctly
- [ ] Monitoring coverage verified
- [ ] Performance metrics within expected range
- [ ] Tests passing (>90% test suite)
- [ ] Documentation reviewed and complete
- [ ] Phase 1 sign-off approved

---

**Total Items**: 156

**Completion Threshold**: 85% (133 items) to proceed to Phase 2

**Critical Items**: All items marked with [CRITICAL] must be completed

**Phase 1 Notes**:
- pgvector ~80 QPS is realistic for CloudLab c220g5 (not 471 QPS claim)
- SGLang requires Q4_K_M quantization for 8GB VRAM
- LLM evaluation requires MLflow 2.18+ for LLM-as-a-judge features
- Feast Redis online store is required (offline-only not sufficient)

---

**Last Updated**: 2026-01-12

**For AI Agents**: When completing Phase 1 checklist:
1. Verify all observability is working before adding ML/data components
2. Test pgvector with realistic workload (not synthetic benchmarks)
3. Verify SGLang configuration for Tesla P4 constraints
4. Test CrewAI with real cognitive tasks
5. Ensure all metrics are flowing to Prometheus
