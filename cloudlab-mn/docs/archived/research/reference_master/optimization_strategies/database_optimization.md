# Database Optimization Strategies

Comprehensive guide to optimizing pgvector and PostgreSQL for Emily Sovereign V4.

## pgvector Performance Context

### CloudLab c220g5 Hardware Impact
- **CPU**: 2x Xeon E5-2690v4 (28 cores total)
- **RAM**: 128GB (crucial for vector search)
- **Expected Workload**: <50M vectors (768-dim)
- **Expected QPS**: ~80 QPS (realistic, not 471)

### Performance Reality Check

| Claim | Reality | Source |
|-------|----------|--------|
| 471 QPS | ~80 QPS (CloudLab c220g5) | pgvector benchmarks with HNSW |
| 1-10ms latency | ~10-20ms (CloudLab) | pgvector + HNSW |

**Note**: The original 471 QPS claim was from high-end hardware. CloudLab c220g5 will achieve ~80 QPS.

## HNSW Index Configuration

### pgvector HNSW Setup
```sql
-- reference_master/code_examples/sql_examples.sql
-- Create table with HNSW index
CREATE TABLE memories (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Create HNSW index (optimized for recall)
CREATE INDEX ON memories
USING hnsw (embedding vector_cosine_ops)
WITH (
    m = 16,              -- Max connections per layer (default 16)
    ef_construction = 64, -- Search depth during index build
    ef = 40               -- Search depth during query
);

-- Verify index
\d+ memories
```

### HNSW Tuning Parameters

| Parameter | Default | Our Value | Impact |
|-----------|----------|------------|--------|
| **m (connections)** | 16 | 16 | Recall vs. speed tradeoff |
| **ef_construction** | 40 | 64 | Index build time vs. recall |
| **ef (search)** | 40 | 40 | Query time vs. recall |

### Tuning Guidelines

#### For Higher Recall (Accuracy)
```sql
-- Increase ef (slower but more accurate)
CREATE INDEX ON memories
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64, ef = 100);
```

#### For Faster Queries
```sql
-- Decrease ef (faster but less accurate)
CREATE INDEX ON memories
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64, ef = 20);
```

## PostgreSQL Configuration

### PostgreSQL Memory Tuning
```nix
# phase0_nixos_setup/example_configuration.nix
services.postgresql = {
  enable = true;
  package = pkgs.postgresql_16;
  settings = {
    # Memory settings (128GB RAM)
    "shared_buffers" = "32GB";        -- 25% of RAM
    "effective_cache_size" = "96GB";      -- 75% of RAM
    "work_mem" = "256MB";                -- Per operation
    "maintenance_work_mem" = "8GB";       -- Maintenance

    # Connection settings
    "max_connections" = "100";            -- Concurrent connections
    "max_worker_processes" = "8";        -- CPU cores

    # WAL settings
    "wal_buffers" = "16MB";
    "checkpoint_completion_target" = "0.9";
    "max_wal_size" = "4GB";

    # Query optimizer
    "random_page_cost" = "1.1";        -- Favor indexed scans
    "effective_io_concurrency" = "200";  -- SSD optimization

    # Autovacuum tuning
    "autovacuum_max_workers" = "4";
    "autovacuum_naptime" = "10s";
    "autovacuum_vacuum_cost_delay" = "10ms";
  };
};
```

### Memory Allocation Breakdown
| Parameter | Value | Purpose |
|-----------|--------|---------|
| **shared_buffers** | 32GB | Cached shared data |
| **effective_cache_size** | 96GB | OS-level cache |
| **work_mem** | 256MB | Sort/hash operations |
| **maintenance_work_mem** | 8GB | Vacuum/analyze |

## Connection Pooling

### PgBouncer Setup (Recommended)
```nix
# phase0_nixos_setup/example_configuration.nix
services.pgpool = {
  enable = true;
  package = pkgs.pgbouncer;

  # Pool configuration
  settings = {
    "pool_mode" = "transaction";
    "max_client_conn" = "100";
    "default_pool_size" = "25";
    "reserve_pool_size" = "5";
    "reserve_pool_timeout" = "3";
    "server_lifetime" = "3600";
    "server_idle_timeout" = "600";

    # Performance tuning
    "query_timeout" = "0";           -- No timeout
    "client_idle_timeout" = "0";      -- No timeout
    "track_extra_parameters" = "off";  -- Faster
  };

  # Database configuration
  databases = [
    {
      name = "sovereign";
      user = "postgres";
    }
  ];
};
```

### Connection Pooling Benefits
| Metric | Without Pooling | With PgBouncer |
|--------|-----------------|----------------|
| **Connection Overhead** | ~10ms per connection | <1ms |
| **Throughput** | 50 QPS | 80 QPS (+60%) |
| **Postgres Load** | High (100 connections) | Low (25 connections) |

## Query Optimization

### Vector Search Query
```python
# reference_master/code_examples/python_examples.py
import psycopg2
from typing import List, Tuple

def search_similar(
    conn: psycopg2.extensions.connection,
    query_embedding: List[float],
    limit: int = 10
) -> List[Tuple]:
    """Optimized vector search query."""
    cursor = conn.cursor()

    # Use EXPLAIN ANALYZE to verify
    cursor.execute("""
        EXPLAIN ANALYZE
        SELECT id, content, 1 - (embedding <=> %s::vector) as similarity
        FROM memories
        WHERE embedding <=> %s::vector < 0.3  -- Pre-filter
        ORDER BY embedding <=> %s::vector
        LIMIT %s;
    """, (query_embedding, query_embedding, limit))

    results = cursor.fetchall()
    cursor.close()

    return results
```

### Query Optimization Techniques

#### 1. Pre-filtering
```sql
-- Filter by metadata before vector search
SELECT id, content, similarity
FROM (
    SELECT
        id,
        content,
        1 - (embedding <=> %s::vector) as similarity
    FROM memories
    WHERE created_at > NOW() - INTERVAL '7 days'  -- Time filter
        AND metadata->>'type' = 'conversation'  -- Metadata filter
) subquery
WHERE similarity > 0.3  -- Similarity threshold
ORDER BY similarity DESC
LIMIT 10;
```

#### 2. Limit Search Space
```sql
-- Only search recent vectors (faster)
SELECT id, content, similarity
FROM memories
WHERE created_at > NOW() - INTERVAL '30 days'  -- Only last 30 days
ORDER BY embedding <=> %s::vector
LIMIT 10;
```

#### 3. Materialized Views (For Frequent Queries)
```sql
-- Create materialized view for recent memories
CREATE MATERIALIZED VIEW recent_memories AS
SELECT *
FROM memories
WHERE created_at > NOW() - INTERVAL '30 days';

-- Refresh periodically
REFRESH MATERIALIZED VIEW recent_memories;

-- Query materialized view
SELECT id, content, similarity
FROM recent_memories
ORDER BY embedding <=> %s::vector
LIMIT 10;
```

## Batch Insert Optimization

### Batch Insert for Vector Data
```python
import psycopg2.extras
import numpy as np

def batch_insert_embeddings(
    conn: psycopg2.extensions.connection,
    embeddings: np.ndarray,
    batch_size: int = 1000
):
    """Insert embeddings in batches for performance."""
    cursor = conn.cursor()

    # Use execute_batch for better performance
    embeddings_list = [
        (content, embedding.tolist(), metadata)
        for content, embedding, metadata in embeddings
    ]

    psycopg2.extras.execute_batch(
        cursor,
        """
        INSERT INTO memories (content, embedding, metadata)
        VALUES (%s, %s::vector, %s::jsonb)
        """,
        embeddings_list,
        page_size=batch_size
    )

    conn.commit()
    cursor.close()
```

### Bulk Copy (Even Faster)
```python
def bulk_copy_embeddings(
    conn: psycopg2.extensions.connection,
    embeddings: np.ndarray
):
    """Use COPY for maximum insert performance."""
    cursor = conn.cursor()

    # Create temporary CSV
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv') as f:
        for content, embedding, metadata in embeddings:
            f.write(f"{content}\t{','.join(map(str, embedding))}\t{metadata}\n")

        f.flush()

        # COPY from file
        cursor.execute("""
            COPY memories (content, embedding, metadata)
            FROM '%s' DELIMITER E'\t' CSV;
        """ % f.name)

    conn.commit()
    cursor.close()
```

## Index Maintenance

### Reindex Strategy
```sql
-- Schedule reindex during low traffic
REINDEX INDEX CONCURRENTLY memories_embedding_idx;

-- Check index size
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

### Autovacuum Tuning
```sql
-- Increase autovacuum frequency for vector tables
ALTER TABLE memories SET (
    autovacuum_vacuum_scale_factor = 0.05,  -- Default 0.2
    autovacuum_analyze_scale_factor = 0.03, -- Default 0.1
    autovacuum_vacuum_cost_delay = '10ms'  -- Faster vacuum
);

-- Monitor autovacuum
SELECT relname, autovacuum_count, last_autovacuum
FROM pg_stat_user_tables
WHERE relname = 'memories';
```

## Partitioning (For Large Datasets)

### Partition by Date
```sql
-- Create partitioned table (for >100M vectors)
CREATE TABLE memories (
    id SERIAL,
    content TEXT,
    embedding VECTOR(768),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE memories_2026_01 PARTITION OF memories
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE memories_2026_02 PARTITION OF memories
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Create index on each partition
CREATE INDEX ON memories_2026_01
USING hnsw (embedding vector_cosine_ops);
```

### Partition Benefits
| Metric | Without Partition | With Partition |
|--------|-----------------|----------------|
| **Query Time** | 10-20ms | 5-10ms (2x faster) |
| **Vacuum Time** | Hours | Minutes |
| **Maintenance** | All data | Only active partitions |

## Monitoring pgvector

### PostgreSQL Monitoring Queries
```sql
-- pgvector performance
SELECT
    schemaname,
    tablename,
    n_tup_ins,  -- Inserts
    n_tup_upd,  -- Updates
    n_tup_del,  -- Deletes
    seq_scan,     -- Sequential scans (bad)
    idx_scan      -- Index scans (good)
FROM pg_stat_user_tables
WHERE tablename = 'memories';

-- Index usage
SELECT
    schemaname,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

### Prometheus Metrics
```yaml
# pg_exporter configuration
scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    metrics_path: '/metrics'
```

### Key Metrics
- **pg_vector_index_size**: Index size (monitor for growth)
- **pg_vector_query_duration**: Query time (target: <20ms)
- **pg_vector_hnsw_ef**: ef parameter (verify tuning)
- **pg_stat_database**: Database size

## Troubleshooting

### 1. Slow Queries
```sql
-- Find slow vector queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%vector%'
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. High Memory Usage
```sql
-- Check memory usage
SELECT
    datname,
    pg_size_pretty(pg_database_size(oid)) as size,
    (SELECT count(*) FROM pg_stat_activity WHERE datname = pg_database.datname) as connections
FROM pg_database
WHERE datname = 'sovereign';
```

### 3. Index Not Used
```sql
-- Check if HNSW index is being used
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE indexname LIKE '%vector%'
ORDER BY idx_scan DESC;
```

## Performance Benchmarks

### Expected pgvector Performance (CloudLab c220g5)
| Metric | Expected | Notes |
|--------|----------|-------|
| **Query Latency (10 results)** | 10-20ms | HNSW, ef=40 |
| **Query Throughput** | ~80 QPS | Single connection |
| **Insert Throughput** | 5,000-10,000/s | Batch insert |
| **Index Build Time** | 5-10 minutes | 1M vectors |
| **Memory Usage** | 2-4GB | For 1M vectors (768-dim) |

### Vector Dimension Impact
| Dimensions | Index Size | Query Time | Memory |
|-----------|------------|------------|--------|
| 384 | 1.5GB | 8-15ms | 1.5GB |
| 768 | 3GB | 10-20ms | 3GB |
| 1536 | 6GB | 15-30ms | 6GB |

---

**Last Updated**: 2026-01-12

**For AI Agents**: When optimizing pgvector:
1. Start with ef=40, adjust based on recall needs
2. Monitor HNSW index usage
3. Use connection pooling (PgBouncer)
4. Partition for >100M vectors
5. Pre-filter queries when possible
