# AI Agent Guide: For Development Agent

Comprehensive guide for future AI agents developing new features for Emily Sovereign V4.

## Project Architecture Overview

### System Components
- **Phase 0**: NixOS base OS, ZFS storage, WireGuard VPN, Prometheus/Grafana monitoring
- **Phase 1**: Observability (Cilium/Hubble/Langfuse/DeepFlow/Pyroscope), Vector DB (pgvector), Inference (SGLang), Multi-Agent (CrewAI), MLflow, DVC, Feast
- **Phase 2**: WasmEdge, QUIC, Unikernels (Nanos), Ray
- **Phase 3**: IPFS, Advanced Monitoring, Workflow Automation (Prefect/Temporal), Backup, Security

### Key Technologies
- **NixOS**: Declarative OS configuration
- **ZFS**: Copy-on-write filesystem with RAIDZ2
- **PostgreSQL**: Relational database with pgvector extension
- **pgvector**: Vector similarity search with HNSW
- **SGLang**: LLM inference server (Tesla P4 compatible)
- **CrewAI**: Multi-agent orchestration framework
- **MLflow**: Experiment tracking and model registry
- **DVC**: Data versioning
- **Feast**: Feature store
- **Ray**: Distributed computing
- **WasmEdge**: WebAssembly runtime
- **IPFS**: Distributed storage
- **Prefect**: Workflow orchestration

## Development Workflow

### 1. Understand Requirements
- [ ] Read user request thoroughly
- [ ] Identify affected components (Phase 0-3)
- [ ] Identify dependencies (other services, databases, etc.)
- [ ] Clarify ambiguities (ask user if needed)
- [ ] Estimate effort (simple/medium/complex)

### 2. Analyze Codebase
- [ ] Locate relevant files (use glob/grep)
- [ ] Read existing implementations (use read tool)
- [ ] Understand patterns (code style, conventions)
- [ ] Identify integration points (APIs, database schemas)
- [ ] Review configuration files (NixOS, environment variables)
- [ ] Document current state (before changes)

### 3. Plan Implementation
- [ ] Create todo list (use todowrite)
- [ ] Break down into atomic steps
- [ ] Estimate time for each step
- [ ] Identify potential risks
- [ ] Plan testing strategy
- [ ] Plan rollback strategy

### 4. Implement Changes
- [ ] Make code changes (use write/edit tools)
- [ ] Follow existing patterns (code style, conventions)
- [ ] Update documentation (inline comments, docstrings)
- [ ] Update configuration files (if needed)
- [ ] Mark todo items as in_progress
- [ ] Mark todo items as completed (as you go)

### 5. Test Changes
- [ ] Run unit tests (pytest)
- [ ] Run integration tests (if applicable)
- [ ] Verify manually (if needed)
- [ ] Check diagnostics (lsp_diagnostics)
- [ ] Fix any issues found
- [ ] Re-test until passing

### 6. Deploy Changes
- [ ] Update CI/CD pipeline (if automated deployment)
- [ ] Test deployment in staging (if available)
- [ ] Deploy to production (with proper approval)
- [ ] Verify deployment successful
- [ ] Monitor for issues (use observability tools)

### 7. Document Changes
- [ ] Update README.md (if API/UI changes)
- [ ] Update CHANGELOG.md (if applicable)
- [ ] Update runbooks (if operational changes)
- [ ] Update checklists (if new requirements)
- [ ] Commit changes with descriptive message

## Code Style & Conventions

### Python Code
- **Imports**: PEP 8 style, grouped (std lib, third-party, local)
- **Type Hints**: Use typing module for function signatures
- **Docstrings**: Google style docstrings for all functions
- **Error Handling**: Specific exceptions, not bare except
- **Logging**: Use Python logging module, not print()
- **Testing**: Use pytest, Hypothesis for property-based tests

### NixOS Configuration
- **Style**: Follow NixOS module examples
- **Formatting**: 2-space indentation
- **Comments**: Explain non-obvious configurations
- **Versions**: Pin package versions in flake.lock
- **Services**: Use NixOS service modules (not manual systemd)

### SQL Code
- **Style**: UPPERCASE keywords, lowercase identifiers
- **Indexing**: Use descriptive index names
- **Comments**: Explain complex queries
- **Performance**: Use EXPLAIN ANALYZE before queries
- **Transactions**: Use explicit transactions for multi-step operations

### YAML Configuration
- **Indentation**: 2-space indentation (consistent)
- **Comments**: Explain non-obvious settings
- **Validation**: Validate YAML syntax before commit
- **Environment Variables**: Use ${VAR} syntax

## Testing Guidelines

### Unit Tests
- [ ] Test in isolation (no external dependencies)
- [ ] Use fixtures for test data
- [ ] Mock external services (APIs, databases)
- [ ] Test success cases
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Achieve >90% code coverage

### Integration Tests
- [ ] Test with real dependencies (PostgreSQL, Redis, etc.)
- [ ] Test API integrations (Langfuse, MLflow, etc.)
- [ ] Test network integrations (WireGuard, QUIC, etc.)
- [ ] Test with realistic data volumes
- [ ] Clean up test data after tests

### E2E Tests
- [ ] Test complete user flows
- [ ] Test error recovery
- [ ] Test performance (latency, throughput)
- [ ] Test with production-like data
- [ ] Run in production-like environment

### Property-Based Tests (Hypothesis)
- [ ] Test with generated data (not hardcoded)
- [ ] Test boundary conditions
- [ ] Test edge cases
- [ ] Use Hypothesis strategies for custom types
- [ ] Keep examples manageable (<1000)

## Common Patterns

### Adding New Cognitive Module
1. **Define Module**: Create module definition in CrewAI
2. **Implement Logic**: Write cognitive logic in Python
3. **Add Tests**: Create unit tests for module
4. **Integrate Observability**: Add Langfuse tracing
5. **Update Documentation**: Document module behavior
6. **Test Integration**: Test module in crew workflow

### Adding New API Endpoint
1. **Define Endpoint**: Create API route (FastAPI/Flask/etc.)
2. **Implement Logic**: Write endpoint handler
3. **Add Validation**: Validate input/output
4. **Add Logging**: Add logging/tracing
5. **Add Tests**: Create unit/integration tests
6. **Update Documentation**: Document API contract
7. **Test Deployment**: Deploy and test endpoint

### Adding New Metrics
1. **Define Metric**: Create Prometheus metric definition
2. **Add Collection**: Add metric collection code
3. **Export Metric**: Add to Prometheus exporter
4. **Create Dashboard**: Add panel to Grafana
5. **Create Alert**: Add alert rule (if critical)
6. **Test Metric**: Verify metric appears in Prometheus
7. **Update Documentation**: Document metric meaning

### Adding New Storage
1. **Define Schema**: Create database table/schema
2. **Add Indexes**: Create appropriate indexes (HNSW for vectors)
3. **Add Constraints**: Add foreign keys, constraints
4. **Create Migrations**: Write migration script (if needed)
5. **Add Tests**: Test CRUD operations
6. **Update Documentation**: Document schema
7. **Backup Data**: Backup before deployment

## Common Pitfalls to Avoid

### Don'ts
- ❌ Don't suppress type errors (no as any, no @ts-ignore)
- ❌ Don't skip tests (all tests must pass)
- ❌ Don't commit secrets (use sops-nix)
- ❌ Don't hardcode values (use environment variables)
- ❌ Don't ignore errors (handle explicitly)
- ❌ Don't skip documentation (document all changes)
- ❌ Don't break existing patterns (follow conventions)
- ❌ Don't ignore performance (measure before/after)

### Dos
- ✅ Do use existing patterns (follow codebase conventions)
- ✅ Do test thoroughly (unit, integration, E2E)
- ✅ Do document everything (code, configs, decisions)
- ✅ Do measure performance (establish baselines)
- ✅ Do handle errors gracefully (retry, fallback)
- ✅ Do use observability (logs, traces, metrics)
- ✅ Do use proper types (type hints, validated schemas)
- ✅ Do secure secrets (encrypt, rotate)

## Tools for Development

### Code Analysis
- **glob**: Find files by pattern
- **grep**: Search code content
- **read**: Read file contents
- **lsp_document_symbols**: Get file outline
- **lsp_find_references**: Find usages of symbol
- **lsp_diagnositics**: Check for errors

### Code Editing
- **write**: Create new files
- **edit**: Modify existing files (with context)
- **lsp_rename**: Rename symbols (refactoring)

### Background Processing
- **background_task**: Run long tasks in background
- **background_output**: Get background task results
- **background_cancel**: Cancel background tasks

### Task Management
- **todowrite**: Create/update todo lists
- **todoread**: Read todo lists
- **Mark tasks in_progress** when starting
- **Mark tasks completed** immediately when done

## Performance Considerations

### Database Queries
- [ ] Use EXPLAIN ANALYZE before optimizing
- [ ] Create appropriate indexes (HNSW for vectors)
- [ ] Use connection pooling (PgBouncer)
- [ ] Batch operations when possible
- [ ] Avoid SELECT * (specify columns)
- [ ] Use LIMIT for large result sets

### Python Code
- [ ] Use async for I/O operations
- [ ] Cache expensive operations
- [ ] Use generators for large datasets
- [ ] Profile with Pyroscope
- [ ] Avoid global state
- [ ] Use context managers for resources

### Network Operations
- [ ] Use connection pooling
- [ ] Implement retries with exponential backoff
- [ ] Use timeouts for all operations
- [ ] Implement circuit breakers (for external services)
- [ ] Use appropriate protocols (QUIC over TCP)

## Security Considerations

### Input Validation
- [ ] Validate all user inputs
- [ ] Sanitize database queries (use parameterized queries)
- [ ] Validate file paths (prevent directory traversal)
- [ ] Validate API payloads (size, format)
- [ ] Use schema validation (Pydantic, JSON Schema)

### Authentication & Authorization
- [ ] Implement proper authentication (not just secrets)
- [ ] Implement authorization checks (user permissions)
- [ ] Use session tokens (not long-lived credentials)
- [ ] Implement token rotation
- [ ] Log authentication attempts

### Secrets Management
- [ ] Never commit secrets to Git
- [ ] Use sops-nix for all secrets
- [ ] Rotate secrets regularly
- [ ] Use environment variables for secrets
- [ ] Use least-privilege access (only needed permissions)

## Troubleshooting Guide

### Common Issues

#### "Import Error"
1. Check if package installed (pip list)
2. Check Python path (python -c "import sys; print(sys.path)")
3. Install missing dependencies
4. Rebuild NixOS (nixos-rebuild switch)

#### "Connection Refused"
1. Check if service running (systemctl status)
2. Check if port open (ss -tlnp)
3. Check firewall rules (nft list rules)
4. Check service logs (journalctl -u service)

#### "Out of Memory"
1. Check system memory (free -h)
2. Check process memory (ps aux)
3. Kill unnecessary processes
4. Reduce batch size / parallelism
5. Increase system memory (if possible)

#### "Slow Performance"
1. Check system resources (top, htop)
2. Check logs for errors
3. Profile with Pyroscope
4. Check network (ping, iperf3)
5. Check database (EXPLAIN ANALYZE)

## Collaboration

### Before Committing
- [ ] Review changes (self-review)
- [ ] Run tests (pytest)
- [ ] Check diagnostics (lsp_diagnostics)
- [ ] Format code (if applicable)
- [ ] Update documentation
- [ ] Write descriptive commit message

### Commit Message Format
```
<component>: <brief description>

<optional detailed description>

<optional footer>
- Fixes: #<issue>
- Related: #<issue>
```

### After Committing
- [ ] Push to repository
- [ ] Monitor CI/CD pipeline
- [ ] Verify deployment succeeded
- [ ] Update issue tracker (if applicable)
- [ ] Notify team (if applicable)

---

**Last Updated**: 2026-01-12

**For AI Agents**: When using this guide:
1. Always understand requirements before starting
2. Always analyze codebase before making changes
3. Always follow existing patterns and conventions
4. Always test thoroughly (unit, integration, E2E)
5. Always document everything
6. Always measure performance
7. Always consider security implications
8. Always mark todo items as in_progress and completed
9. Always use lsp tools for code navigation
10. Always run diagnostics before marking work complete
