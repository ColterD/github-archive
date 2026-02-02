-- PostgreSQL + pgvector Schema for Emily Sovereign V4
-- Platform: CloudLab c220g5
-- Performance target: ~80 QPS at 99% recall (not 471 QPS)

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- Episodic Memories (Partitioned by Timestamp)
-- =============================================

CREATE TABLE episodic_memories (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    episode_id UUID NOT NULL DEFAULT gen_random_uuid(),
    
    -- Affective State (3D vector: valence, arousal, dominance)
    -- Normalized to [-1, 1]
    affective_state VECTOR(3) NOT NULL,
    
    -- Semantic Embedding (1536D: OpenAI text-embedding-ada-002)
    semantic_embedding VECTOR(1536) NOT NULL,
    
    -- Memory Content
    content TEXT NOT NULL,
    
    -- Context (JSONB for flexibility)
    context JSONB,
    
    -- Salience Score (for Global Workspace competition)
    -- Normalized to [0, 1]
    salience FLOAT NOT NULL DEFAULT 0.0,
    
    -- Neurotransmitter State (at time of encoding)
    neurotransmitters JSONB
) PARTITION BY RANGE (timestamp);

-- Create 24 monthly partitions (2 years of data)
DO $$
DECLARE i INT;
BEGIN
FOR i IN 0..23 LOOP
    EXECUTE format(
        'CREATE TABLE episodic_memories_%s PARTITION OF episodic_memories
            FOR VALUES FROM (%L) TO (%L)',
        i::text,
        date_trunc('month', CURRENT_DATE + (i || ' months')::interval)::date,
        date_trunc('month', CURRENT_DATE + ((i + 1) || ' months')::interval)::date
    );
END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create current month partition
CREATE TABLE episodic_memories_current PARTITION OF episodic_memories
    FOR VALUES FROM (date_trunc('month', CURRENT_DATE)) TO (date_trunc('month', CURRENT_DATE + INTERVAL '1 month'));

-- =============================================
-- HNSW Indexes (Tuned for CloudLab Hardware)
-- =============================================

-- Affective State Index (3D, low-dimensional)
-- Tuned parameters: m=8 (lower for 3D), ef_construction=256 (higher recall), ef_search=64
CREATE INDEX idx_episodic_affective_current
    ON episodic_memories_current
    USING hnsw (affective_state vector_cosine_ops)
    WITH (
        m = 8,              -- Lower for low-dimensional
        ef_construction = 256, -- Higher for better recall
        ef_search = 64        -- Higher search accuracy
    );

-- Semantic Embedding Index (1536D, high-dimensional)
-- Tuned parameters: m=32 (higher for 1536D), ef_construction=200 (standard), ef_search=100
CREATE INDEX idx_episodic_semantic_current
    ON episodic_memories_current
    USING hnsw (semantic_embedding vector_cosine_ops)
    WITH (
        m = 32,             -- Higher for high-dimensional
        ef_construction = 200,  -- Standard for 1536D
        ef_search = 100        -- Much higher for 1536D vectors
    );

-- Salience Index (for Global Workspace competition)
CREATE INDEX idx_episodic_salience_current
    ON episodic_memories_current(salience DESC);

-- Timestamp Index (for partition pruning)
CREATE INDEX idx_episodic_timestamp_current
    ON episodic_memories_current(timestamp DESC);

-- =============================================
-- IVFFlat Fallback Index (for slow HDD builds)
-- =============================================

CREATE INDEX idx_episodic_semantic_ivfflat_current
    ON episodic_memories_current
    USING ivfflat (semantic_embedding vector_cosine_ops)
    WITH (lists = 1000);

-- =============================================
-- Views for Common Queries
-- =============================================

-- Recent memories (last 30 days)
CREATE OR REPLACE VIEW recent_memories AS
SELECT *
FROM episodic_memories_current
WHERE timestamp >= NOW() - INTERVAL '30 days'
ORDER BY salience DESC;

-- High-salience memories (Global Workspace candidates)
CREATE OR REPLACE VIEW high_salience_memories AS
SELECT *
FROM episodic_memories_current
WHERE salience >= 0.7
ORDER BY timestamp DESC
LIMIT 100;

-- =============================================
-- Functions for Vector Search
-- =============================================

-- Retrieve similar affective states (fast, 3D)
CREATE OR REPLACE FUNCTION retrieve_affective_memories(
    current_state VECTOR(3),
    time_window_days INT DEFAULT 30,
    k INT DEFAULT 10
)
RETURNS TABLE (
    episode_id UUID,
    content TEXT,
    affective_state VECTOR(3),
    context JSONB,
    similarity FLOAT,
    timestamp TIMESTAMPTZ
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        episode_id,
        content,
        affective_state,
        context,
        1 - (affective_state <=> current_state) as similarity,
        timestamp
    FROM episodic_memories_current
    WHERE timestamp >= NOW() - (time_window_days || ' days')::INTERVAL
    ORDER BY affective_state <=> current_state
    LIMIT k;
END;
$$ LANGUAGE plpgsql;

-- Retrieve similar semantic memories (optimized for 1536D)
CREATE OR REPLACE FUNCTION retrieve_semantic_memories(
    query_embedding VECTOR(1536),
    time_window_days INT DEFAULT 30,
    k INT DEFAULT 10
)
RETURNS TABLE (
    episode_id UUID,
    content TEXT,
    semantic_embedding VECTOR(1536),
    context JSONB,
    similarity FLOAT,
    timestamp TIMESTAMPTZ
)
AS $$
BEGIN
    RETURN QUERY
    WITH candidate_memories AS (
        SELECT
            id,
            episode_id,
            content,
            semantic_embedding,
            context,
            timestamp
        FROM episodic_memories_current
        WHERE timestamp >= NOW() - (time_window_days || ' days')::INTERVAL
        LIMIT 10000  -- Reduce vector search space
    ),
    vector_search AS (
        SELECT
            id,
            episode_id,
            content,
            context,
            timestamp,
            1 - (semantic_embedding <=> query_embedding) as similarity
        FROM candidate_memories
        ORDER BY semantic_embedding <=> query_embedding
        LIMIT k
    )
    SELECT * FROM vector_search;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Maintenance Jobs
-- =============================================

-- Function to create new monthly partition
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    -- Calculate partition name and date range
    partition_name := 'episodic_memories_' || to_char(NOW() + INTERVAL '1 month', 'YYYY_MM');
    start_date := date_trunc('month', NOW() + INTERVAL '1 month');
    end_date := start_date + INTERVAL '1 month';
    
    -- Create partition
    EXECUTE format(
        'CREATE TABLE %I PARTITION OF episodic_memories
            FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        start_date,
        end_date
    );
    
    -- Create indexes
    EXECUTE format(
        'CREATE INDEX idx_%I_affective ON %I
            USING hnsw (affective_state vector_cosine_ops)
            WITH (m=8, ef_construction=256, ef_search=64)',
        partition_name, partition_name
    );
    
    EXECUTE format(
        'CREATE INDEX idx_%I_semantic ON %I
            USING hnsw (semantic_embedding vector_cosine_ops)
            WITH (m=32, ef_construction=200, ef_search=100)',
        partition_name, partition_name
    );
    
    RAISE NOTICE 'Created partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Performance Tuning for CloudLab
-- =============================================

-- Adjust PostgreSQL parameters for vector workloads
ALTER SYSTEM SET shared_buffers = '8GB';           -- 6% of 128GB RAM
ALTER SYSTEM SET effective_cache_size = '24GB';       -- 19% of RAM
ALTER SYSTEM SET work_mem = '64MB';                -- Per-operation memory
ALTER SYSTEM SET maintenance_work_mem = '1GB';       -- Vacuum operations
ALTER SYSTEM SET max_parallel_workers_per_gather = 4; -- 28 cores / 7
ALTER SYSTEM SET random_page_cost = '1.1';         -- SSD-like tuning (HDD, but helps)

-- Revert for session (restart required)
SELECT pg_reload_conf();

-- =====
