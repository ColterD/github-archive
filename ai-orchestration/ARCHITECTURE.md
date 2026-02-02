# Architecture Diagrams

This document provides visual representations of the Mimir AI Orchestration architecture.

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                        Your Development Environment                       │
│                     C:\Users\Colter\Desktop\Projects                     │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │
│  │ AI_Orchestration│  │   Github/      │  │ Other Projects │           │
│  │   (Mimir)      │  │    7Days       │  │                │           │
│  │                │  │                │  │                │           │
│  │ • Neo4j        │  │ • Can access   │  │ • Can access   │           │
│  │ • MCP Server   │  │   Mimir        │  │   Mimir        │           │
│  │ • Ollama       │  │ • Share memory │  │ • Share memory │           │
│  └────────────────┘  └────────────────┘  └────────────────┘           │
│         ↕                    ↕                     ↕                    │
│         └────────────────────┴──────────────────────┘                   │
│                              │                                          │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
                               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                       Docker Network (mimir_network)                     │
│                                                                          │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐ │
│  │                    │  │                    │  │                  │ │
│  │      Neo4j         │  │   Mimir MCP        │  │     Ollama       │ │
│  │   Graph Database   │◄─┤     Server         │◄─┤   Embeddings     │ │
│  │                    │  │                    │  │                  │ │
│  │  • Stores nodes    │  │  • MCP protocol    │  │  • Local models  │ │
│  │  • Relationships   │  │  • Tool execution  │  │  • Semantic vec  │ │
│  │  • Graph queries   │  │  • Neo4j bridge    │  │  • No external   │ │
│  │                    │  │                    │  │    APIs needed   │ │
│  └────────────────────┘  └────────────────────┘  └──────────────────┘ │
│    Port: 7474, 7687         Port: 9042              Port: 11434       │
│                                                                          │
│  Persistent Storage:                                                     │
│  • ./data/neo4j/       • ./data/mimir/         • ollama_models volume  │
│  • ./logs/neo4j/       • ./logs/mimir/                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                         AI Tools & Agents                                │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   GitHub     │  │    Claude    │  │  Custom      │  │   Other    │ │
│  │   Copilot    │  │   Desktop    │  │  Scripts     │  │  MCP Tools │ │
│  │  (VS Code)   │  │              │  │  (Py/JS/PS)  │  │            │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│         ↓                  ↓                 ↓                ↓         │
│         └──────────────────┴─────────────────┴────────────────┘         │
│                              │                                          │
│                      MCP Protocol                                       │
│                   http://localhost:9042                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Creating a Memory

```
┌──────────────┐
│  AI Agent    │  "Create a memory about our authentication decision"
└──────┬───────┘
       │
       ↓ (MCP call: memory_node)
┌──────────────────┐
│   MCP Server     │  1. Receive request
│   Port 9042      │  2. Validate parameters
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│   Ollama         │  3. Generate embedding vector
│   Port 11434     │     (if embeddings enabled)
└──────┬───────────┘
       │
       ↓ (Vector: [0.123, -0.456, ...])
┌──────────────────┐
│   Neo4j          │  4. Store node with properties
│   Port 7687      │     - title, content, project
└──────┬───────────┘     - embedding vector
       │                 - timestamp, metadata
       │
       ↓
┌──────────────────┐
│  Graph Database  │  Memory Node Created
│                  │  ┌──────────────┐
│                  │  │ memory-123   │
│                  │  │ "Auth using  │
│                  │  │  JWT tokens" │
│                  │  └──────────────┘
└──────────────────┘
```

### Semantic Search

```
┌──────────────┐
│  AI Agent    │  "Find information about authentication"
└──────┬───────┘
       │
       ↓ (MCP call: vector_search_nodes)
┌──────────────────┐
│   MCP Server     │  1. Receive search query
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│   Ollama         │  2. Generate query embedding
│   Port 11434     │     query → [0.234, -0.567, ...]
└──────┬───────────┘
       │
       ↓ (Query vector)
┌──────────────────┐
│   Neo4j          │  3. Vector similarity search
│   Port 7687      │     CALL db.index.vector.queryNodes()
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│  Search Results  │  4. Return ranked results
│                  │
│  Rank 1: memory-123 (similarity: 0.92)
│  "Auth using JWT tokens"
│
│  Rank 2: memory-456 (similarity: 0.87)
│  "User login implementation"
│
│  Rank 3: file-chunk-789 (similarity: 0.85)
│  "auth.ts: function validateToken()"
│
└──────────────────┘
       │
       ↓ (Formatted results)
┌──────────────┐
│  AI Agent    │  Receives relevant context
└──────────────┘
```

## Network Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Host Machine (Windows)                     │
│                                                                │
│  Ports Exposed:                                                │
│  • 7474  → Neo4j Browser (HTTP)                               │
│  • 7687  → Neo4j Bolt Protocol                                │
│  • 9042  → Mimir MCP Server (HTTP)                            │
│  • 11434 → Ollama API (HTTP)                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           Docker Bridge Network: mimir_network           │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │  neo4j       │  │  mcp-server  │  │   ollama     │ │ │
│  │  │              │  │              │  │              │ │ │
│  │  │ internal:    │  │ internal:    │  │ internal:    │ │ │
│  │  │  7474, 7687  │  │    3000      │  │   11434      │ │ │
│  │  │              │  │              │  │              │ │ │
│  │  │ hostname:    │  │ hostname:    │  │ hostname:    │ │ │
│  │  │  neo4j       │  │  mcp-server  │  │  ollama      │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │         ↕                  ↕                  ↕         │ │
│  │    bolt://neo4j:7687      ↕       http://ollama:11434 │ │
│  │                            ↕                           │ │
│  │                    Containers can resolve             │ │
│  │                    each other by name                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Volume Mounts:                                                │
│  • Host: ./data/neo4j    → Container: /data                   │
│  • Host: ./logs/neo4j    → Container: /logs                   │
│  • Host: ./data/mimir    → Container: /app/data               │
│  • Host: ./logs/mimir    → Container: /app/logs               │
│  • Host: C:\Users\...\Projects → Container: /workspace (ro)   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Memory Storage Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        Neo4j Graph Database                     │
│                                                                 │
│  Node Types:                                                    │
│                                                                 │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│  │ Memory   │     │   Todo   │     │   File   │              │
│  ├──────────┤     ├──────────┤     ├──────────┤              │
│  │ • title  │     │ • title  │     │ • path   │              │
│  │ • content│     │ • status │     │ • name   │              │
│  │ • project│     │ • priority│    │ • content│              │
│  │ • tags   │     │ • assignee│    │ • language│             │
│  │ • embedding    │ • embedding│   │ • chunks │              │
│  └──────────┘     └──────────┘     └──────────┘              │
│       │                │                 │                    │
│       └────────────────┴─────────────────┘                    │
│                        │                                      │
│                        ↓                                      │
│            All nodes have embeddings                          │
│            for semantic search                                │
│                                                               │
│  Relationship Types:                                          │
│                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  relates_to │    │  depends_on │    │  part_of    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ implements  │    │   calls     │    │  contains   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                               │
│  Example Graph:                                               │
│                                                               │
│     ┌──────────┐                                             │
│     │ Memory:  │─────relates_to────┐                        │
│     │"Use JWT" │                    │                        │
│     └────┬─────┘                    │                        │
│          │                          ↓                        │
│    implements                  ┌──────────┐                 │
│          │                     │  File:   │                 │
│          ↓                     │ auth.ts  │                 │
│     ┌──────────┐               └──────────┘                 │
│     │  Todo:   │                    ↑                        │
│     │"Add JWT" │──────calls─────────┘                       │
│     └──────────┘                                             │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## File Indexing Flow

```
┌──────────────────────────────────────────────────────────────────┐
│            Project Directory (on host machine)                   │
│            C:\Users\Colter\Desktop\Projects\Github\7Days         │
│                                                                  │
│  ├── src/                                                        │
│  │   ├── main.ts         (300 lines)                           │
│  │   ├── auth.ts         (150 lines)                           │
│  │   └── utils.ts        (200 lines)                           │
│  ├── tests/                                                      │
│  │   └── auth.test.ts    (100 lines)                           │
│  ├── .gitignore                                                  │
│  └── package.json                                                │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ↓ (npm run index:add)
┌────────────────────────────────────────────────────────────────────┐
│                   MCP Server (Indexing Process)                    │
│                                                                    │
│  Step 1: Scan Directory                                           │
│  • Read all files recursively                                     │
│  • Respect .gitignore rules                                       │
│  • Filter by supported file types                                 │
│                                                                    │
│  Step 2: Chunk Large Files                                        │
│  • main.ts → 3 chunks (1000 chars each)                          │
│  • auth.ts → 2 chunks                                             │
│  • utils.ts → 2 chunks                                            │
│                                                                    │
│  Step 3: Generate Embeddings                                      │
│  • Send each chunk to Ollama                                      │
│  • Receive embedding vectors (768 dimensions)                     │
│                                                                    │
│  Step 4: Store in Neo4j                                           │
│  • Create File nodes with metadata                                │
│  • Create FileChunk nodes with content                            │
│  • Link: File -[:HAS_CHUNK]-> FileChunk                          │
│  • Add vector index for semantic search                           │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     ↓
┌────────────────────────────────────────────────────────────────────┐
│                      Neo4j Graph Result                            │
│                                                                    │
│  ┌─────────────┐                                                  │
│  │ File:       │─┐                                                │
│  │ main.ts     │ │                                                │
│  └─────────────┘ │                                                │
│                  ├─HAS_CHUNK→ ┌──────────────┐                   │
│                  │             │ FileChunk 0  │                   │
│                  │             │ (lines 1-50) │                   │
│                  │             │ embedding: [...]                 │
│                  │             └──────────────┘                   │
│                  │                                                 │
│                  ├─HAS_CHUNK→ ┌──────────────┐                   │
│                  │             │ FileChunk 1  │                   │
│                  │             │ (lines 51-100)                   │
│                  │             │ embedding: [...]                 │
│                  │             └──────────────┘                   │
│                  │                                                 │
│                  └─HAS_CHUNK→ ┌──────────────┐                   │
│                                │ FileChunk 2  │                   │
│                                │ (lines 101-150)                  │
│                                │ embedding: [...]                 │
│                                └──────────────┘                   │
│                                                                    │
│  Now searchable with semantic queries!                            │
└────────────────────────────────────────────────────────────────────┘
```

## Cross-Project Memory Sharing

```
┌──────────────────────────────────────────────────────────────────┐
│                    Workspace Structure                           │
│              C:\Users\Colter\Desktop\Projects                    │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Project A   │  │ Project B   │  │ Project C   │            │
│  │ (7Days)     │  │ (WebApp)    │  │ (API)       │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                 │                 │                    │
│         │                 │                 │                    │
│         └─────────────────┼─────────────────┘                    │
│                           │                                      │
│                  All projects can:                               │
│                  • Create memories                               │
│                  • Search memories                               │
│                  • Create relationships                          │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ↓
┌───────────────────────────────────────────────────────────────────┐
│                  Shared Memory Graph (Neo4j)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Project A Memories:                                          ││
│  │ • "Use React for UI" (memory-1, project: 7Days)             ││
│  │ • "Implemented multiplayer" (memory-2, project: 7Days)      ││
│  └──────────────────────────────────────────────────────────────┘│
│                            │                                      │
│                      relates_to                                  │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Project B Memories:                                          ││
│  │ • "Also using React" (memory-3, project: WebApp)            ││
│  │ • "Need authentication" (memory-4, project: WebApp)         ││
│  └──────────────────────────────────────────────────────────────┘│
│                            │                                      │
│                      depends_on                                  │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Project C Memories:                                          ││
│  │ • "JWT authentication ready" (memory-5, project: API)       ││
│  │ • "OAuth endpoints added" (memory-6, project: API)          ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  AI Agent query: "How do we handle authentication?"              │
│  Results: memory-4, memory-5, memory-6 (cross-project!)         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Startup Sequence

```
Time →

T+0s    ┌─────────────────────────────────────────┐
        │ docker compose up -d                    │
        └─────────────────────────────────────────┘
                          ↓
T+5s    ┌─────────────────────────────────────────┐
        │ Neo4j container starting                │
        │ • Loading database                      │
        │ • Starting Bolt listener (7687)         │
        │ • Starting HTTP listener (7474)         │
        └─────────────────────────────────────────┘
                          ↓
T+10s   ┌─────────────────────────────────────────┐
        │ Ollama container starting               │
        │ • Loading models from volume            │
        │ • Starting API server (11434)           │
        └─────────────────────────────────────────┘
                          ↓
T+15s   ┌─────────────────────────────────────────┐
        │ MCP Server container starting           │
        │ • Waiting for Neo4j health check       │
        │ • Waiting for Ollama health check      │
        └─────────────────────────────────────────┘
                          ↓
T+30s   ┌─────────────────────────────────────────┐
        │ Neo4j HEALTHY ✓                        │
        │ • Bolt protocol ready                   │
        │ • Browser accessible                    │
        └─────────────────────────────────────────┘
                          ↓
T+35s   ┌─────────────────────────────────────────┐
        │ Ollama HEALTHY ✓                       │
        │ • API responding                        │
        │ • Models loaded                         │
        └─────────────────────────────────────────┘
                          ↓
T+40s   ┌─────────────────────────────────────────┐
        │ MCP Server HEALTHY ✓                   │
        │ • Connected to Neo4j                    │
        │ • Connected to Ollama                   │
        │ • MCP tools registered                  │
        │ • HTTP server listening (9042)          │
        └─────────────────────────────────────────┘
                          ↓
T+45s   ┌─────────────────────────────────────────┐
        │ ALL SERVICES READY ✓                   │
        │ • System fully operational              │
        │ • Ready for AI agent connections        │
        │ • Ready for file indexing               │
        └─────────────────────────────────────────┘
```

## Health Check Flow

```
┌────────────────────────────────────────────────────────────┐
│  Docker Compose Health Checks (every 30 seconds)           │
└────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Neo4j        │  │  Ollama       │  │  MCP Server   │
│               │  │               │  │               │
│  Test:        │  │  Test:        │  │  Test:        │
│  cypher-shell │  │  ollama list  │  │  HTTP GET     │
│  RETURN 1     │  │               │  │  /health      │
│               │  │               │  │               │
│  Success: 200 │  │  Success: 0   │  │  Success: 200 │
│  ↓            │  │  ↓            │  │  ↓            │
│  HEALTHY ✓   │  │  HEALTHY ✓   │  │  HEALTHY ✓   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ↓
                    ┌───────────────┐
                    │  All Services │
                    │   HEALTHY ✓  │
                    └───────────────┘
```

---

## Multi-Project Architecture

### AI_Orchestration as Master Knowledge Base

AI_Orchestration serves as the **central knowledge repository** that indexes and sees ALL projects. It provides cross-project visibility, pattern recognition, and knowledge sharing.

**Capabilities:**
- Query ALL project memories (no project filter)
- Vector search across ALL projects automatically
- Index source code from any project directory
- See file contents, structure, and relationships
- Cross-project pattern recognition

**Current Projects:**
- `AI_Orchestration` - Core infrastructure, Mimir, Docker, Neo4j patterns
- `tiresias` - Browser extension, Manifest V3, React patterns
- *Future projects appear automatically as they create memories*

### Project Query Protocol

```
┌─────────────────────────────────────────────────────┐
│         AI_ORCHESTRATION (Master KB)                │
│                                                      │
│  ┌────────────────┐         ┌──────────────────┐   │
│  │  Mimir + Neo4j │◄────────┤  File Indexing   │   │
│  │   (Shared DB)  │         │  - AI_Orch src   │   │
│  │                │         │  - Tiresias src  │   │
│  │  Queries ALL   │         │  - Future projects│  │
│  │  projects      │         └──────────────────┘   │
│  │  (no filter)   │                                 │
│  └────────────────┘                                 │
│         ▲                                            │
│         │ Shared Neo4j @ localhost:7687             │
└─────────┼────────────────────────────────────────────┘
          │
          ├──────────────┬──────────────┐
          │              │              │
     ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
     │ Tiresias │  │ Project  │  │  Future  │
     │          │  │    B     │  │ Projects │
     │ Step 1:  │  │          │  │          │
     │ Query    │  │ Query    │  │ Query    │
     │ AI_Orch  │  │ protocol │  │ protocol │
     │ FIRST ✓ │  │ similar  │  │ similar  │
     │          │  │          │  │          │
     │ Step 2:  │  └──────────┘  └──────────┘
     │ Query    │
     │ Tiresias │
     │ SECOND ✓│
     └──────────┘
```

**Tiresias Protocol (Example):**
```
User Request → Tiresias Agent
    ↓
Step 1: Query AI_Orchestration (MANDATORY FIRST)
    - memory_node(filters={project: 'AI_Orchestration'})
    - vector_search_nodes (filter for AI_Orch)
    - Retrieve foundational patterns
    ↓
Step 2: Query Tiresias (SECOND)
    - memory_node(filters={project: 'tiresias'})  
    - vector_search_nodes (filter for Tiresias)
    - Retrieve project-specific context
    ↓
Step 3: Combine Knowledge
    - Apply AI_Orch patterns as foundation
    - Apply Tiresias specifics as customization
    ↓
Response with both sources
```

### Project Folder Indexing

**Index a New Project:**

```javascript
// Via Mimir MCP Tool
index_folder({
  path: 'C:\\Users\\Colter\\Desktop\\Projects\\Github\\project-name',
  generate_embeddings: true,
  recursive: true,
  file_patterns: ['*.ts', '*.tsx', '*.js', '*.jsx', '*.md'],
  ignore_patterns: ['node_modules', 'dist', 'build', '.turbo', 'coverage']
});
```

**Recommended File Patterns:**

**TypeScript/JavaScript:**
```javascript
file_patterns: ['*.ts', '*.tsx', '*.js', '*.jsx', '*.json', '*.md']
ignore_patterns: ['node_modules', 'dist', 'build', '.turbo', 'coverage', '.next']
```

**Python:**
```javascript
file_patterns: ['*.py', '*.pyi', '*.md', '*.toml', '*.yaml']
ignore_patterns: ['__pycache__', 'venv', '.venv', 'dist', 'build', '.pytest_cache']
```

**Rust:**
```javascript
file_patterns: ['*.rs', '*.toml', '*.md']
ignore_patterns: ['target', 'Cargo.lock']
```

**Monitor Indexed Projects:**

```javascript
// List currently indexed folders
list_folders();

// Count files per project
docker exec mimir_neo4j cypher-shell -u neo4j -p "password" \
  "MATCH (w:WatchConfig)-[:WATCHES]->(f:File)
   RETURN w.path as project, count(f) as files
   ORDER BY files DESC"
```

### File Indexing Benefits

1. **Code Search**: Semantic search across all projects finds relevant implementations
2. **Pattern Recognition**: AI identifies similar code patterns across projects
3. **Cross-References**: Links concepts between projects (e.g., Docker configs)
4. **Context**: AI has full codebase context when answering questions
5. **Learning**: New projects learn from existing implementations

### Cross-Project Protection Rules

**Read-Only Access:**
- Other projects can READ AI_Orchestration memories
- Other projects CANNOT UPDATE AI_Orchestration memories
- Other projects CANNOT DELETE AI_Orchestration memories
- Each project creates memories with appropriate `project` tag

**Memory Tagging:**
```javascript
// AI_Orchestration core knowledge
memory_node({
  operation: 'add',
  type: 'memory',
  properties: {
    project: 'AI_Orchestration',
    title: 'Docker Configuration Pattern',
    content: '...'
  }
});

// Cross-project patterns
memory_node({
  operation: 'add',
  type: 'memory',
  properties: {
    project: 'AI_Orchestration',
    title: 'General Code Deduplication Pattern',
    content: '...',
    tags: ['cross-project', 'pattern', 'best-practice']
  }
});
```

---

These diagrams should help visualize how the system works together. For interactive exploration, use:

- **Neo4j Browser** (http://localhost:7474) - Visual graph exploration
- **Docker Dashboard** - Container status and logs
- **Management Script** - `.\mimir-manage.ps1 status` for quick overview
