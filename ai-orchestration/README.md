# AI Orchestration - Mimir Memory/RAG Stack

This is a centralized AI memory and RAG (Retrieval-Augmented Generation) system based on [Mimir](https://github.com/orneryd/Mimir), providing persistent memory storage and semantic search capabilities for AI agents across all projects in your workspace.

## 🎯 Overview

This Docker stack provides:

- **Neo4j Graph Database**: Store memories, tasks, and relationships
- **Mimir MCP Server**: Model Context Protocol server for AI agent integration
- **Ollama**: Local embeddings for semantic search (no external dependencies)
- **Cross-Project Memory**: All projects in the workspace can access shared memories

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- At least 2GB RAM allocated to Docker
- PowerShell or Windows Terminal

### Installation

1. **Copy environment configuration:**
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit `.env` file** (optional):
   - Change `NEO4J_PASSWORD` for production use
   - Verify `HOST_WORKSPACE_ROOT` points to your Projects folder

3. **Clone Mimir repository into this folder:**
   ```powershell
   git clone https://github.com/orneryd/Mimir.git mimir
   ```

4. **Start the services:**
   ```powershell
   docker compose up -d
   ```

5. **Wait for services to initialize** (30-60 seconds):
   ```powershell
   docker compose ps
   ```

6. **Pull the embedding model** (first time only):
   ```powershell
   docker exec -it mimir_ollama ollama pull nomic-embed-text
   ```

### Verify Installation

Check that all services are healthy:
```powershell
docker compose ps
```

You should see:
- `mimir_neo4j` - healthy
- `mimir_ollama` - healthy
- `mimir_mcp_server` - healthy

**Access Points:**
- Neo4j Browser: http://localhost:7474 (user: `neo4j`, password: from `.env`)
- MCP Server Health: http://localhost:9042/health
- Ollama API: http://localhost:11434

## 📁 Project Structure

```
AI_Orchestration/
├── docker-compose.yml          # Main orchestration file
├── .env.example                # Environment template
├── .env                        # Your configuration (create from .env.example)
├── README.md                   # This file
├── mimir/                      # Cloned Mimir repository
├── data/                       # Persistent data (auto-created)
│   ├── neo4j/                  # Neo4j database files
│   └── mimir/                  # Mimir data
└── logs/                       # Application logs (auto-created)
    ├── neo4j/
    └── mimir/
```

## 🔧 Usage

### Start Services
```powershell
docker compose up -d
```

### Stop Services
```powershell
docker compose down
```

### View Logs
```powershell
# All services
docker compose logs -f

# Specific service
docker compose logs -f mcp-server
docker compose logs -f neo4j
docker compose logs -f ollama
```

### Restart a Service
```powershell
docker compose restart mcp-server
```

### Index a Project
To make a project's files searchable:

```powershell
# From within the mimir directory
cd mimir
npm install  # First time only

# Index a project (use absolute paths)
npm run index:add C:/Users/Colter/Desktop/Projects/Github/7Days

# List indexed folders
npm run index:list

# Remove indexed folder
npm run index:remove C:/Users/Colter/Desktop/Projects/Github/7Days
```

### Access Neo4j Browser

1. Open http://localhost:7474
2. Login with:
   - Username: `neo4j`
   - Password: (from your `.env` file)
3. Explore your memory graph!

## 🤖 Using with AI Agents

### GitHub Copilot Integration

Mimir provides MCP (Model Context Protocol) tools that GitHub Copilot can use to:

- Create and manage tasks/todos
- Store and retrieve memories
- Perform semantic searches across projects
- Track relationships between tasks and files
- Cross-reference information between projects

The MCP server is available at `http://localhost:9042` for AI agents to connect.

### Available MCP Tools

#### Memory Operations
- `memory_node` - Create/read/update nodes (tasks, files, concepts)
- `memory_edge` - Create relationships between nodes
- `memory_batch` - Bulk operations for efficiency
- `memory_lock` - Multi-agent coordination
- `memory_clear` - Clear data (use carefully!)
- `get_task_context` - Get filtered context by agent type

#### File Indexing
- `index_folder` - Index code files into graph
- `remove_folder` - Stop watching folder
- `list_folders` - Show watched folders

#### Vector Search
- `vector_search_nodes` - Semantic search with AI embeddings
- `get_embedding_stats` - Embedding statistics

#### Todo Management
- `todo` - Manage individual tasks
- `todo_list` - Manage task lists

## 🗂️ Cross-Project Memory Access

All projects in your workspace (`C:/Users/Colter/Desktop/Projects` by default) are mounted read-only into the Mimir container at `/workspace`. This means:

- Any project can be indexed for semantic search
- Memories can reference files across multiple projects
- AI agents can find relevant information from any indexed project
- Knowledge graphs can connect concepts across your entire workspace

### Example: Index Multiple Projects

```powershell
cd mimir

# Index 7Days project
npm run index:add C:/Users/Colter/Desktop/Projects/Github/7Days

# Index another project
npm run index:add C:/Users/Colter/Desktop/Projects/MyApp

# Now AI agents can search across both projects!
```

## 🧪 Testing Memory Creation

### Create Memory via Script

A standalone Node.js script is provided to create and verify memory nodes:

```bash
# Ensure services are running
docker compose up -d

# Run the memory creation script
node create-memory.js
```

This script will:
1. Create a memory node with title "GitHub Coding Agent Test"
2. Search for the created memory using vector search
3. Verify the memory exists in the database

### Run Playwright Tests

Automated tests are available in the `tests/` directory:

```bash
cd tests

# Install dependencies (first time only)
npm install
npx playwright install chromium

# Run all tests
npx playwright test

# Run specific test
npx playwright test specs/github-agent-memory.spec.ts

# View test report
npx playwright show-report
```

## 🔍 Semantic Search

With Ollama embeddings enabled, you can perform semantic searches:

- **Example**: "Find authentication code" will match files about login, auth, security, etc.
- **Not just keywords**: Searches by meaning, not exact text
- **Cross-project**: Search across all indexed projects

## 🛠️ Troubleshooting

### Services won't start
```powershell
# Check Docker is running
docker info

# Check for port conflicts
docker compose ps

# Restart services
docker compose down
docker compose up -d
```

### Can't connect to Neo4j
```powershell
# Wait for Neo4j to fully start (30-60 seconds)
docker compose logs neo4j

# Check it's responding
curl http://localhost:7474
```

### Embeddings not working
```powershell
# Check Ollama is running
docker compose ps ollama

# Check model is available
docker exec -it mimir_ollama ollama list

# Pull embedding model manually if needed
docker exec -it mimir_ollama ollama pull nomic-embed-text
```

### File indexing fails
```powershell
# Make sure path is absolute (not relative)
# Windows paths: C:/Users/...
# NOT: ~/Desktop/... or ./Projects/...

# Check MCP server logs
docker compose logs mcp-server
```

## 📊 Data Persistence

All data is stored in local directories and persists between restarts:

- `./data/neo4j/` - Database files (tasks, relationships, memories)
- `./logs/` - Application logs
- `ollama_models` volume - Downloaded embedding models

**⚠️ Warning**: `docker compose down -v` will delete all data including volumes!

## 🔒 Security Notes

- **Default password**: Change `NEO4J_PASSWORD` in production
- **Read-only workspace**: Projects are mounted read-only for safety
- **Local network only**: Services are not exposed to the internet

## 📚 Additional Resources

- [Mimir GitHub](https://github.com/orneryd/Mimir)
- [Mimir Quick Start](https://github.com/orneryd/Mimir/blob/main/QUICKSTART.md)
- [Mimir Documentation](https://github.com/orneryd/Mimir/tree/main/docs)
- [Neo4j Documentation](https://neo4j.com/docs/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 🤝 Contributing

This is a customized deployment of Mimir. For issues specific to this setup, check the logs and configuration. For Mimir-specific issues, please refer to the [Mimir repository](https://github.com/orneryd/Mimir/issues).

## 📄 License

This deployment configuration is provided as-is. Mimir itself is licensed under MIT - see the [Mimir LICENSE](https://github.com/orneryd/Mimir/blob/main/LICENSE) for details.
