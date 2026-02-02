# SQL Examples

Complete collection of SQL examples for PostgreSQL, pgvector, MLflow, Feast integration.

## PostgreSQL Setup

### Database Creation
```sql
-- Create database for Sovereign project
CREATE DATABASE sovereign
  WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Connect to database
\c sovereign
```

### Extensions
```sql
-- Enable pgvector for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_stat_statements for query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Enable pg_cron for scheduled tasks (if needed)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify extensions
SELECT * FROM pg_extension;
```

## pgvector Examples

### Vector Table Creation
```sql
-- Create table with vector embeddings
CREATE TABLE memories (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    access_count INTEGER DEFAULT 0
);

-- Create index on created_at for time-based queries
CREATE INDEX memories_created_at_idx ON memories (created_at DESC);
```

### HNSW Index Creation
```sql
-- Create HNSW index optimized for CloudLab c220g5
-- Expected performance: ~80 QPS (not 471 QPS - that was from high-end hardware)

CREATE INDEX memories_embedding_idx
ON memories
USING hnsw (embedding vector_cosine_ops)
WITH (
    m = 16,                  -- Max connections per layer
    ef_construction = 64,       -- Search depth during index build
    ef = 40                   -- Search depth during query
);
```

### Vector Search Query
```sql
-- Search for similar vectors (top 10 results)
SELECT
    id,
    content,
    1 - (embedding <=> '[0.1, 0.2, ..., 0.768]'::vector) AS similarity,
    created_at,
    metadata
FROM memories
WHERE 1 - (embedding <=> '[0.1, 0.2, ..., 0.768]'::vector) < 0.3  -- Similarity threshold
ORDER BY embedding <=> '[0.1, 0.2, ..., 0.768]'::vector
LIMIT 10;
```

### Batch Insert
```sql
-- Insert vectors in batch (better performance)
INSERT INTO memories (content, embedding, metadata, access_count)
VALUES
    ('Memory 1', '[0.1, 0.2, ..., 0.768]'::vector, '{"type": "conversation"}', 0),
    ('Memory 2', '[0.1, 0.2, ..., 0.768]'::vector, '{"type": "reflection"}', 0),
    ('Memory 3', '[0.1, 0.2, ..., 0.768]'::vector, '{"type": "task"}', 0)
ON CONFLICT DO NOTHING;
```

### Update Memory
```sql
-- Update memory metadata
UPDATE memories
SET
    metadata = metadata || '{"updated": true}',
    access_count = access_count + 1
WHERE id = 123;
```

### Delete Old Memories
```sql
-- Delete memories older than 90 days
DELETE FROM memories
WHERE created_at < NOW() - INTERVAL '90 days';
```

## MLflow Integration

### MLflow Tables
```sql
-- MLflow tables (auto-created by MLflow)
-- schemas: experiments, runs, metrics, params, tags, metrics_history

-- Query latest runs
SELECT
    run_id,
    experiment_id,
    start_time,
    end_time,
    status,
    artifact_uri
FROM runs
ORDER BY start_time DESC
LIMIT 10;
```

### MLflow Metrics
```sql
-- Query metrics for specific run
SELECT
    key,
    value,
    timestamp,
    step
FROM metrics
WHERE run_id = 'uuid-here'
ORDER BY timestamp;
```

### MLflow Parameters
```sql
-- Query parameters for specific run
SELECT
    key,
    value
FROM params
WHERE run_id = 'uuid-here';
```

## Feast Integration

### Feast Tables
```sql
-- Feast creates these tables automatically
-- features, feature_views, entity_keys, feature_refs, etc.

-- Query feature view
SELECT
    feature_name,
    feature_value_type,
    value_type
FROM feature_views
WHERE feature_view_name = 'memory_features_v1';
```

### Feast Entity Data
```sql
-- Feast entity keys are stored separately
SELECT
    entity_key,
    entity_type,
    entity_description
FROM entity_keys
WHERE feature_view_name = 'memory_features_v1';
```

## Advanced Queries

### Pre-filtering for Performance
```sql
-- Filter by metadata before vector search
-- Reduces search space and improves performance

SELECT
    id,
    content,
    similarity
FROM (
        SELECT
            id,
            content,
            1 - (embedding <=> '[0.1, 0.2, ..., 0.768]'::vector) AS similarity
        FROM memories
        WHERE created_at > NOW() - INTERVAL '30 days'  -- Only search recent
            AND metadata->>'type' = 'conversation'    -- Filter by type
    ) subquery
WHERE similarity > 0.3  -- Apply similarity threshold
ORDER BY similarity DESC
LIMIT 10;
```

### Join with Metadata
```sql
-- Join vector search with related data
SELECT
    m.id,
    m.content,
    m.similarity,
    m.metadata,
    a.action_date
FROM (
    SELECT
        id,
        content,
        1 - (embedding <=> '[0.1, 0.2, ..., 0.768]'::vector) AS similarity,
        metadata
    FROM memories
    ORDER BY embedding <=> '[0.1, 0.2, ..., 0.768]'::vector
    LIMIT 10
) m
LEFT JOIN actions a
  ON m.metadata->>'memory_id' = a.memory_id::text;
```

### Aggregation Queries
```sql
-- Aggregate statistics
SELECT
    COUNT(*) as total_memories,
    AVG(access_count) as avg_access,
    MAX(access_count) as max_access,
    DATE_TRUNC('day', created_at) as date
FROM memories
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC
LIMIT 30;
```

## Maintenance Queries

### Table Statistics
```sql
-- Get table statistics for optimization
SELECT
    schemaname,
    tablename,
    n_tup_ins,       -- Inserts
    n_tup_upd,       -- Updates
    n_tup_del,       -- Deletes
    n_live_tup,      -- Live tuples
    n_dead_tup,      -- Dead tuples (vacuum needed)
    last_vacuum,
    last_autovacuum,
    vacuum_count
FROM pg_stat_user_tables
WHERE tablename = 'memories';
```

### Index Usage
```sql
-- Check which indexes are being used
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,         -- Index scans (good)
    seq_scan,         -- Sequential scans (bad)
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'memories';
```

### Kill Long-Running Queries
```sql
-- Find queries running longer than 5 minutes
SELECT
    pid,
    usename,
    application_name,
    state,
    query_start,
    state_change,
    query
FROM pg_stat_activity
WHERE state IN ('active', 'idle in transaction')
  AND query_start < NOW() - INTERVAL '5 minutes';
```

## Performance Tuning

### Update Statistics
```sql
-- Update table statistics for query planner
ANALYZE memories;

-- Update only specific columns
ANALYZE memories (embedding, created_at);
```

### Reindex
```sql
-- Rebuild HNSW index (CONCURRENTLY to avoid blocking)
REINDEX INDEX CONCURRENTLY memories_embedding_idx;

-- Reindex entire table
REINDEX TABLE CONCURRENTLY memories;
```

### Vacuum
```sql
-- Vacuum table (reclaim space and update statistics)
VACUUM ANALYZE memories;

-- Vacuum specific table with aggressive autovacuum settings
VACUUM (VERBOSE, ANALYZE) memories;
```

## Backup & Restore

### Backup (pg_dump)
```bash
# Backup database
pg_dump -U postgres -d sovereign > sovereign_backup.sql

# Backup specific table
pg_dump -U postgres -d sovereign -t memories > memories_backup.sql

# Backup schema only
pg_dump -U postgres -d sovereign -s > schema_backup.sql
```

### Restore (psql)
```bash
# Restore database
psql -U postgres -d sovereign < sovereign_backup.sql

# Restore specific table
psql -U postgres -d sovereign < memories_backup.sql
```

## Monitoring Queries

### Query Performance
```sql
-- Track query execution time
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

### Database Size
```sql
-- Get database size
SELECT
    datname,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
WHERE datname = 'sovereign';

-- Get table size
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname::text, tablename::text)) as size
FROM pg_tables
WHERE schemaname = 'public';
```

---

**Last Updated**: 2026-01-12

**For AI Agents**: When using SQL examples:
1. Adapt to your specific use case
2. Use EXPLAIN ANALYZE before complex queries
3. Consider CloudLab c220g5 hardware constraints
4. pgvector ~80 QPS is realistic (not 471 QPS)
5. Use CONCURRENTLY for DDL in production
6. Monitor query performance regularly
