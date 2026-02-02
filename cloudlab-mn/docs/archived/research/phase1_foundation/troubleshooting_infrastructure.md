# Troubleshooting Guide: Phase 1 Infrastructure

---

## Observability Stack

### Cilium Fails to Start

**Symptom**: `cilium status` shows "Disabled"

**Cause**: Kernel version < 5.10

**Solution**:
```bash
# Upgrade kernel to NixOS unstable
sudo nix-channel --add https://nixos.org/channels/nixos-unstable nixos
sudo nixos-rebuild switch --upgrade
sudo reboot
```

### Hubble No Flows Visible

**Symptom**: `cilium hubble observe` empty

**Cause**: Flow recording disabled

**Solution**:
```bash
cilium hubble enable --live
cilium hubble observe
```

### Langfuse Database Errors

**Symptom**: "connection refused" in Langfuse logs

**Cause**: PostgreSQL unhealthy

**Solution**:
```bash
docker-compose -f docker-compose.langfuse.yml restart postgres
docker exec langfuse-postgres pg_isready -U langfuse
```

---

## Vector Database

### pgvector Too Slow

**Symptom**: Queries >2 seconds

**Cause**: Missing indexes or wrong HNSW parameters

**Solution**:
```sql
-- Check index usage
EXPLAIN ANALYZE SELECT * FROM episodic_memories ORDER BY semantic_embedding <=> %s LIMIT 10;

-- Look for "Seq Scan" (bad) vs "Index Scan" (good)

-- Rebuild HNSW with tuned parameters
DROP INDEX idx_episodic_semantic;
CREATE INDEX idx_episodic_semantic USING hnsw (semantic_embedding vector_cosine_ops) WITH (m=32, ef_construction=200, ef_search=100);
```

### Out of Memory Errors

**Symptom**: "out of memory" in PostgreSQL logs

**Solution**:
```sql
-- Reduce work_mem
SET work_mem = '32MB';

-- Check active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

---

## Inference Server

### SGLang OOM

**Symptom**: "CUDA out of memory"

**Cause**: Model too large for 8GB VRAM

**Solution**:
```python
# Use 4-bit AWQ quantization
runtime = Runtime(
    model_path="models/phi-3-mini-4k-instruct-awq",
    quantization="awq",  # 4-bit
    max_model_len=1024,  # Reduced context
    gpu_memory_utilization=0.70  # More conservative
)
```

### Slow Inference

**Symptom**: Latency >500ms

**Cause**: No continuous batching

**Solution**:
```bash
sglang launch \
    --continuous-batching=True \
    --schedule-policy=lpm  # Longest-priority-first
```

---

## Multi-Agent Framework

### CrewAI State Loss

**Symptom**: Agents don't share state

**Cause**: Redis not configured

**Solution**:
```python
import redis

# Shared state backend
redis_state = redis.Redis(host='localhost', port=6379, db=0)
```

### LangGraph Infinite Loops

**Symptom**: Workflow never terminates

**Cause**: Missing termination condition

**Solution**:
```python
def continue_node(state):
    return "continue" if state["should_continue"] else "end"
```

---

## MLOps Integration

### MLflow Experiment Lost

**Symptom**: Experiment not found in UI

**Cause**: Wrong tracking URI

**Solution**:
```python
mlflow.set_tracking_uri("postgresql://mlflow:password@postgres/mlflow")
```

### DVC Remote Sync Failed

**Symptom**: `dvc push` fails

**Cause**: MinIO unreachable

**Solution**:
```bash
# Test MinIO connectivity
curl http://minio.cloudlab.internal:9000/minio/health/live

# Configure remote
dvc remote add cloudlab-datasets s3://emily-datasets
dvc remote modify cloudlab-datasets endpointurl http://minio.cloudlab.internal:9000
```

### Feast Online Store Timeout

**Symptom**: >2s feature retrieval

**Cause**: Not using Redis

**Solution**:
```yaml
# feast_config.yaml
online_store:
  type: feast.infra.online_stores.redis.RedisOnlineStore
  connection_string: "localhost:6379"
```

---

## Testing Infrastructure

### Hypothesis Property Test Fails

**Symptom**: Test passes but property fails

**Cause**: Too narrow strategy

**Solution**:
```python
@given(
    dopamine=strategies.floats(min_value=-1, max_value=1),
    serotonin=strategies.floats(min_value=-1, max_value=1)
)
```

### Coverage Below Target

**Symptom**: Coverage <70%

**Cause**: Missing test cases

**Solution**:
```bash
# Run coverage report
pytest --cov=src --cov-report=html

# Open htmlcov/index.html
# Identify untested functions and add tests
```

---

