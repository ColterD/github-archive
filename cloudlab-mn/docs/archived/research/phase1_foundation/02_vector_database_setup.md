# Vector Database Setup: pgvector Installation and Configuration

**Component**: Phase 1.2 - Vector Database
**Duration**: Week 2 (12 hours)
**Priority**: P0 - Critical for memory retrieval
**Platform**: CloudLab c220g5

---

## Overview

Deploy PostgreSQL with pgvector extension for high-performance vector similarity search.

## Critical Performance Corrections

On CloudLab c220g5 hardware, expected performance is:
- QPS at 99% recall: **~80** (not 471)
- QPS at 95% recall: ~150
- QPS at 90% recall: ~300

## Installation

See example_configurations/pgvector_schema.sql for complete schema with HNSW indexes.

## Performance Optimization

Use tuned HNSW parameters for CloudLab hardware:
- Affective state (3D): m=8, ef_construction=256, ef_search=64
- Semantic embedding (1536D): m=32, ef_construction=200, ef_search=100

## Connection Pooling

Use ThreadedConnectionPool (min=5, max=50) to avoid connection overhead.

## Backup

Integrate with ZFS snapshots and Restic for vector DB backups.

## Sources

- pgvector GitHub: https://github.com/pgvector/pgvector
- REVIEW_AGENT_3_MLOPS.md: Performance corrections

