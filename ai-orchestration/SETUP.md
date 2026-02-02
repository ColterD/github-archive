# Setup Instructions for Mimir AI Orchestration

This guide walks you through setting up the Mimir memory/RAG stack step-by-step.

## Prerequisites Check

Before starting, verify you have:

- [ ] Docker Desktop installed and running
- [ ] At least 2GB RAM allocated to Docker
- [ ] Git installed
- [ ] PowerShell or Windows Terminal

Check Docker memory allocation:
1. Open Docker Desktop
2. Go to Settings → Resources → Memory
3. Ensure at least 2GB is allocated (4GB recommended)

## Step-by-Step Setup

### Step 1: Clone Mimir Repository

From the `AI_Orchestration` directory:

```powershell
git clone https://github.com/orneryd/Mimir.git mimir
```

This creates a `mimir/` subfolder with the Mimir source code.

### Step 2: Create Environment File

```powershell
Copy-Item .env.example .env
```

### Step 3: (Optional) Customize Configuration

Edit the `.env` file if needed:

```powershell
notepad .env
```

**Important settings:**
- `NEO4J_PASSWORD` - Change for production (default: `password`)
- `HOST_WORKSPACE_ROOT` - Path to your Projects folder (default: `C:/Users/Colter/Desktop/Projects`)

**For most users, the defaults are fine!**

### Step 4: Build and Start Services

```powershell
# Build the Docker images and start all services
docker compose up -d
```

This will:
1. Download Neo4j image (~300MB)
2. Download Ollama image (~500MB)
3. Build Mimir MCP server from source
4. Start all services in the background

**First run takes 5-10 minutes for downloads.**

### Step 5: Wait for Services to Initialize

```powershell
# Check service status
docker compose ps
```

Wait until all services show `healthy`:
- `mimir_neo4j` - healthy
- `mimir_ollama` - healthy  
- `mimir_mcp_server` - healthy

This usually takes 30-60 seconds after `docker compose up -d` completes.

### Step 6: Pull Embedding Model

```powershell
# Pull the nomic-embed-text model for semantic search
docker exec -it mimir_ollama ollama pull nomic-embed-text
```

This downloads the embedding model (~275MB) and takes 1-2 minutes.

### Step 7: Verify Installation

**Check health endpoints:**
```powershell
# MCP Server (should return {"status":"ok"})
curl http://localhost:9042/health

# Neo4j Browser (should open in browser)
start http://localhost:7474
```

**Neo4j Login:**
- URL: http://localhost:7474
- Username: `neo4j`
- Password: (from your `.env` file, default: `password`)

**Check Ollama model:**
```powershell
docker exec -it mimir_ollama ollama list
```

Should show `nomic-embed-text` in the list.

## Step 8: (Optional) Index Your First Project

To enable semantic search across a project:

```powershell
# Go into the mimir directory
cd mimir

# Install dependencies (first time only)
npm install

# Index a project (use absolute Windows path)
npm run index:add C:/Users/Colter/Desktop/Projects/Github/7Days

# Watch progress (don't kill it!)
docker compose logs -f mcp-server
```

The indexing process:
1. Scans all files (respects `.gitignore`)
2. Creates chunks for large files
3. Generates embeddings for semantic search
4. Stores in Neo4j graph database

**Time estimate:** 
- Small projects (<100 files): 5-10 seconds
- Medium projects (100-1000 files): 30-60 seconds
- Large projects (1000+ files): 2-5 minutes

## Verification Checklist

After setup, verify:

- [ ] Docker containers are running: `docker compose ps`
- [ ] All services are healthy (green status)
- [ ] Neo4j browser opens: http://localhost:7474
- [ ] MCP server responds: http://localhost:9042/health
- [ ] Ollama has the model: `docker exec -it mimir_ollama ollama list`
- [ ] (Optional) Project indexed successfully

## Common Issues

### Port Already in Use

If you see `port is already allocated`:

1. **Option A**: Stop conflicting service
2. **Option B**: Edit `docker-compose.yml` and change the first port number:
   ```yaml
   ports:
     - "7475:7474"  # Changed 7474 → 7475
   ```

### Neo4j Won't Start

If Neo4j stays unhealthy:

```powershell
# Check logs
docker compose logs neo4j

# Common fix: Increase Docker memory to 4GB
# Docker Desktop → Settings → Resources → Memory
```

### Ollama Model Pull Fails

If model download fails:

```powershell
# Try pulling directly
docker exec -it mimir_ollama ollama pull nomic-embed-text

# If behind corporate proxy, add to .env:
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080

# Then restart
docker compose down
docker compose up -d
```

### MCP Server Fails to Start

```powershell
# Check logs
docker compose logs mcp-server

# Common issue: Neo4j not ready yet
# Wait 60 seconds, then restart:
docker compose restart mcp-server
```

### File Indexing Fails

```powershell
# Make sure you're using absolute paths (not relative)
# ✅ Correct: C:/Users/Colter/Desktop/Projects/MyApp
# ❌ Wrong: ~/Desktop/Projects/MyApp
# ❌ Wrong: ./MyApp

# Check the path is accessible from container:
docker exec -it mimir_mcp_server ls /workspace
```

## Next Steps

Once setup is complete:

1. **Index your projects** for semantic search
2. **Explore Neo4j browser** to see your memory graph
3. **Use with GitHub Copilot** - the MCP server is ready!
4. **Read the README.md** for usage examples

## Maintenance Commands

```powershell
# View all logs
docker compose logs -f

# Restart a service
docker compose restart mcp-server

# Stop all services (data persists)
docker compose down

# Start services again
docker compose up -d

# Nuclear option: Remove everything including data
docker compose down -v
rm -r data/, logs/
```

## Getting Help

If you encounter issues:

1. Check the logs: `docker compose logs [service-name]`
2. Verify service health: `docker compose ps`
3. Review the README.md troubleshooting section
4. Check Mimir documentation: https://github.com/orneryd/Mimir

## Success! 🎉

Your AI memory/RAG stack is now running! All projects in your workspace can now:

- Store persistent memories in Neo4j
- Perform semantic searches across indexed code
- Track relationships between tasks and files
- Share knowledge across projects

The MCP server at http://localhost:9042 is ready for GitHub Copilot and other AI agents to connect!
