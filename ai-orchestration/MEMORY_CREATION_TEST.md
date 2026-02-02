# GitHub Coding Agent Memory Creation Test

## Overview

This implementation adds functionality to create and verify memory nodes using the Mimir MCP server. Two approaches are provided:

1. **Standalone Script** (`create-memory.js`) - Direct Node.js script
2. **Test Suite** (`tests/specs/github-agent-memory.spec.ts`) - Automated Playwright tests

## What Was Implemented

### Memory Node Details

The implementation creates a memory node with the following exact specifications:

- **Title**: "GitHub Coding Agent Test"
- **Content**: "This memory was created by a GitHub Coding Agent during automated testing on 2025-11-15 00:05:26"
- **Type**: memory
- **Tags**: github, coding-agent, automated-test

### Verification Steps

After creating the memory, the implementation verifies it was created successfully by:

1. **Vector Search**: Uses semantic search to find the memory by title/content
2. **Database Query**: Queries all memories to confirm the specific memory exists

## Usage

### Option 1: Run the Standalone Script

```bash
# Start Mimir services
docker compose up -d

# Wait for services to be ready (30-60 seconds)
docker compose ps

# Run the script
node create-memory.js
```

**Expected Output:**
```
==========================================
GitHub Coding Agent Memory Creation Test
==========================================

Creating memory node...
✓ Memory created successfully!
  ID: <generated-id>
  Title: GitHub Coding Agent Test

Searching for created memory...
✓ Memory found in search results!
  Title: GitHub Coding Agent Test
  Similarity: 0.95
  Content preview: This memory was created by a GitHub Coding Agent during automated testing...

Verifying memory exists in database...
✓ Memory confirmed in database!
  Title: GitHub Coding Agent Test
  Content: This memory was created by a GitHub Coding Agent during automated testing on 2025-11-15 00:05:26
  Created: <timestamp>

==========================================
Summary
==========================================
Memory Created: ✓
Found in Search: ✓
Verified in DB: ✓

✓ Test completed successfully!
```

### Option 2: Run the Playwright Tests

```bash
# Install dependencies (first time)
cd tests
npm install
npx playwright install chromium

# Run the test
npx playwright test specs/github-agent-memory.spec.ts

# View detailed report
npx playwright show-report
```

## Technical Details

### API Endpoint

Both implementations use the Mimir MCP server's JSON-RPC API:

- **Base URL**: `http://localhost:9042/mcp`
- **Protocol**: JSON-RPC 2.0
- **Method**: POST

### Memory Creation Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "mcp_mimir_memory_node",
    "arguments": {
      "operation": "add",
      "type": "memory",
      "properties": {
        "title": "GitHub Coding Agent Test",
        "content": "This memory was created by a GitHub Coding Agent during automated testing on 2025-11-15 00:05:26",
        "category": "test",
        "tags": ["github", "coding-agent", "automated-test"]
      }
    }
  }
}
```

### Vector Search Request

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "mcp_mimir_vector_search_nodes",
    "arguments": {
      "query": "GitHub Coding Agent Test",
      "limit": 10,
      "min_similarity": 0.3
    }
  }
}
```

### Query Request

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "mcp_mimir_memory_node",
    "arguments": {
      "operation": "query",
      "type": "memory",
      "filters": {}
    }
  }
}
```

## Prerequisites

1. **Docker**: Docker Desktop installed and running
2. **Services Running**: Mimir stack must be up
   ```bash
   docker compose up -d
   ```
3. **Ollama Model**: Embedding model must be pulled
   ```bash
   docker exec -it mimir_ollama ollama pull nomic-embed-text
   ```

## Troubleshooting

### Connection Refused Error

```
Error: connect ECONNREFUSED 127.0.0.1:9042
```

**Solution**: Ensure services are running
```bash
docker compose ps
docker compose up -d
```

### Memory Not Found in Search

This can happen if the embedding model is not loaded or indexing is in progress.

**Solution**: Wait a few seconds and try again. Verify Ollama is running:
```bash
docker compose logs ollama
docker exec -it mimir_ollama ollama list
```

### Services Not Starting

**Solution**: Check Docker resources and restart
```bash
docker compose down
docker compose up -d
docker compose logs
```

## Files Modified/Created

1. **`create-memory.js`** (new) - Standalone Node.js script
2. **`tests/specs/github-agent-memory.spec.ts`** (new) - Playwright test suite
3. **`README.md`** (modified) - Added testing documentation section

## Integration with CI/CD

The Playwright test suite is designed to work in CI/CD environments:

- Uses headless Chromium browser
- Generates HTML, JSON, and JUnit XML reports
- Can be run in Docker containers
- Configurable timeouts and retries

Example GitHub Actions integration is already documented in `tests/README.md`.

## Future Enhancements

Potential improvements:

- [ ] Add cleanup functionality to delete test memories
- [ ] Support for batch memory creation
- [ ] Performance benchmarking for large-scale operations
- [ ] Integration with monitoring/alerting systems
- [ ] Memory node relationship testing
