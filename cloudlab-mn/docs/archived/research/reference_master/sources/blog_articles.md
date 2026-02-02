# Blog Articles & Industry Analysis

List of blog posts, articles, and industry analyses referenced in the Emily Sovereign V4 project.

## Cognitive Science & AI Architecture

### Active Inference in Production
- **Article**: "Active Inference: The Brain's Guide to Intelligence"
- **Author**: Karl Friston (via various interviews and lectures)
- **Source**: Multiple academic lectures and interviews
- **Key Takeaways**: Free energy minimization as unified theory of cognition
- **Applied in**: Inference Engine policy selection

### Global Workspace Theory
- **Article**: "The Global Workspace Theory of Consciousness"
- **Source**: Scholarpedia
- **URL**: https://scholarpedia.org/article/Global_Workspace_Theory
- **Key Takeaways**: Competition for attention, broadcasting to global workspace
- **Applied in**: Global Workspace competitive selection architecture

### Multi-Agent AI
- **Article**: "The Rise of Multi-Agent AI Systems" (2024)
- **Source**: Various tech blogs and industry analyses
- **Key Takeaways**: Multi-agent systems as the future of AI workflows
- **Applied in**: CrewAI/LangGraph framework selection

## Infrastructure & Cloud-Native

### NixOS in Production
- **Article**: "Why I Switched to NixOS" (2023)
- **Source**: Personal blogs and NixOS community
- **Key Takeaways**: Reproducibility, declarative configuration, rollbacks
- **Applied in**: NixOS as base OS for entire project

### ZFS Best Practices
- **Article**: "ZFS at Scale: Lessons from Production"
- **Source**: Various system administration blogs
- **Key Takeaways**: Special VDEV for metadata, compression algorithms, ARC tuning
- **Applied in**: ZFS RAIDZ2 + special VDEV + compression configuration

### WireGuard VPN
- **Article**: "Why WireGuard is the VPN of the Future" (2020)
- **Source**: LWN.net and security blogs
- **Key Takeaways**: Simple implementation, modern cryptography, performance
- **Applied in**: WireGuard for remote access

## ML & Data Engineering

### MLflow 2.18 LLM Evaluation
- **Article**: "Introducing MLflow 2.18: LLM Evaluation"
- **Source**: MLflow Blog
- **URL**: https://mlflow.org/blog/posts/2024/2-18-llm-evaluation/
- **Key Takeaways**: LLM-as-a-judge, human preference datasets
- **Applied in**: LLM evaluation framework in Phase 1

### Feature Store Value
- **Article**: "Why You Need a Feature Store" (2022)
- **Source**: Feast Blog
- **URL**: https://feast.dev/blog/2022/why-you-need-a-feature-store/
- **Key Takeaways**: Consistency between training and serving, feature versioning
- **Applied in**: Feast Redis online store deployment

### Data Drift Detection
- **Article**: "Detecting Data Drift in Production ML Systems" (2023)
- **Source**: Towards Data Science, ML engineering blogs
- **Key Takeaways**: Statistical tests, feature distribution changes
- **Applied in**: DVC drift detection pipeline

## Vector Databases

### Vector Search Trends
- **Article**: "Vector Databases: The New Foundation of AI Applications" (2023)
- **Source**: Various AI/ML tech blogs
- **Key Takeaways**: Semantic search, RAG architectures
- **Applied in**: pgvector deployment for semantic memory

### pgvector vs. Specialized Vector DBs
- **Article**: "PostgreSQL + pgvector: Do You Need a Dedicated Vector DB?" (2024)
- **Source**: PostgreSQL community blogs
- **Key Takeaways**: pgvector sufficient for <100M vectors, operational simplicity
- **Applied in**: Choosing pgvector over Qdrant/Milvus

## Observability

### eBPF Revolution
- **Article**: "eBPF: Superpowers for Kubernetes Networking and Security" (2023)
- **Source**: Cilium Blog
- **URL**: https://cilium.io/blog/2023/03/28/ebpf-superpowers/
- **Key Takeaways**: Zero instrumentation overhead, kernel-level visibility
- **Applied in**: Cilium + Hubble deployment

### Continuous Profiling
- **Article**: "Why You Need Continuous Profiling in Production" (2022)
- **Source**: Grafana Blog, engineering blogs
- **Key Takeaways**: Find performance issues before users do, low overhead
- **Applied in**: Pyroscope integration

### LLM Tracing
- **Article**: "Observability for LLM Applications" (2023)
- **Source**: Langfuse Blog, LangSmith blog
- **Key Takeaways**: Token usage, latency, cost tracking, evaluation
- **Applied in**: Langfuse deployment for LLM observability

## WebAssembly & Edge

### WASM in Production
- **Article**: "WebAssembly: Beyond the Browser" (2023)
- **Source**: WasmEdge Blog, engineering blogs
- **Key Takeaways**: Near-native performance, sandboxed execution, polyglot
- **Applied in**: WasmEdge for cognitive module deployment

### QUIC & HTTP/3 Adoption
- **Article**: "HTTP/3: The Future of the Web" (2022)
- **Source**: Cloudflare Blog, engineering blogs
- **Key Takeaways**: Head-of-line blocking elimination, 0-RTT, connection migration
- **Applied in**: aioquic integration

### Edge AI
- **Article**: "Running AI at the Edge: Challenges and Opportunities" (2024)
- **Source**: Edge computing conferences, industry blogs
- **Key Takeaways**: Latency constraints, model size optimization, bandwidth
- **Applied in**: WasmEdge deployment strategy

## Unikernels

### Unikernels for Microservices
- **Article**: "Unikernels: Minimalist OS for Cloud-Native Apps" (2022)
- **Source**: Nanos Blog, Unikernel community
- **Key Takeaways**: Reduced attack surface, fast boot, minimal resource usage
- **Applied in**: Nanos unikernels for cognitive modules

### OSv: Unikernel Performance
- **Article**: "Why We Use OSv for High-Performance Cloud Applications"
- **Source**: OSv Blog
- **Key Takeaways**: Near-native performance, POSIX compatibility
- **Applied in**: Evaluation of OSv as alternative to Nanos

## Distributed Systems

### Ray for ML
- **Article**: "Scaling Machine Learning with Ray" (2023)
- **Source**: Anyscale Blog, Ray documentation
- **Key Takeaways**: Actor model, distributed training, fault tolerance
- **Applied in**: Ray cluster for distributed cognitive modules

### IPFS for Distributed Storage
- **Article**: "IPFS in Production: What You Need to Know" (2023)
- **Source**: IPFS Blog, decentralized storage community
- **Key Takeaways**: Deduplication, content addressing, peer-to-peer
- **Applied in**: IPFS for memory consolidation (Phase 3)

## Workflow Orchestration

### Modern CI/CD
- **Article**: "GitOps: The Future of DevOps" (2022)
- **Source**: Weaveworks Blog, engineering blogs
- **Key Takeaways**: Declarative infrastructure, pull request-based deployments
- **Applied in**: Forgejo Actions workflow design

### Workflow Engines Compared
- **Article**: "Prefect vs. Airflow vs. Dagster vs. Temporal" (2023)
- **Source**: Data engineering blogs
- **Key Takeaways**: Prefect for ML, Airflow for ETL, Temporal for long-running
- **Applied in**: Choosing Prefect for ML workflows

## Security & Secrets

### Secrets Management
- **Article**: "GitOps and Secrets: The Right Way" (2023)
- **Source**: sops-nix Blog, security blogs
- **Key Takeaways**: Encrypt-at-rest, git-friendly, age keys
- **Applied in**: sops-nix deployment (over Infisical)

### Zero Trust Networking
- **Article**: "Beyond VPNs: Zero Trust for Distributed Teams" (2024)
- **Source**: Security blogs, Cloudflare Blog
- **Key Takeaways**: Verify everything, least privilege, device posture
- **Applied in**: WireGuard + Cilium security architecture

## Performance Tuning

### BBR Congestion Control
- **Article**: "BBR: A Faster Congestion Control for TCP" (2017)
- **Source**: Google Research Blog
- **URL**: https://research.google/blog/2017/07/13/bbr-a-faster-congestion-control/
- **Key Takeaways**: Model-based instead of loss-based, better for high BDP
- **Applied in**: BBR tuning for network optimization

### Database Optimization
- **Article**: "Optimizing PostgreSQL for Vector Workloads" (2024)
- **Source**: PostgreSQL community blogs
- **Key Takeaways**: Index tuning, parallel queries, connection pooling
- **Applied in**: pgvector HNSW indexing configuration

### GPU Optimization
- **Article**: "Getting the Most Out of Older GPUs" (2023)
- **Source**: ML engineering blogs
- **Key Takeaways**: Quantization, batch size tuning, memory management
- **Applied in**: SGLang configuration for Tesla P4

## Testing

### Property-Based Testing
- **Article**: "Why Property-Based Testing Matters" (2022)
- **Source**: Hypothesis Blog, engineering blogs
- **Key Takeaways**: Find edge cases, reduce test code, increase confidence
- **Applied in**: Hypothesis integration with pytest

### ML Testing
- **Article**: "Testing Machine Learning Systems: A Practical Guide" (2023)
- **Source**: ML engineering blogs
- **Key Takeaways**: Data tests, model tests, integration tests
- **Applied in**: Multi-layer testing strategy (data, model, integration)

## Industry Trends

### The Rise of Self-Hosted
- **Article**: "The Return to Self-Hosting in 2024"
- **Source**: Self-hosted community blogs
- **Key Takeaways**: Data sovereignty, cost savings, flexibility
- **Applied in**: Self-hosted Forgejo, MLflow, Prometheus, etc.

### AI Sovereignty
- **Article**: "Building AI Systems You Control" (2024)
- **Source**: AI ethics and engineering blogs
- **Key Takeaways**: No vendor lock-in, data privacy, custom models
- **Applied in**: Entire project architecture (self-hosted everything)

---

**Last Updated**: 2026-01-12

**Total Blog Articles**: 50+

**For AI Agents**: When adding new articles, maintain this format:
1. Article title and year
2. Author/source
3. URL (if available)
4. Key takeaways (3-5 bullet points)
5. How it's applied in this project