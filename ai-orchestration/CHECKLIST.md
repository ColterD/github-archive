# Setup Checklist

Use this checklist to track your setup progress.

## Pre-Setup Verification

- [ ] **Docker Desktop installed**
  - Download: https://www.docker.com/products/docker-desktop/
  - Version: Latest stable version
  
- [ ] **Docker is running**
  - Open Docker Desktop
  - Check system tray icon is active
  
- [ ] **Docker has enough memory**
  - Docker Desktop → Settings → Resources → Memory
  - Minimum: 2GB (4GB recommended)
  - Current allocation: _______GB
  
- [ ] **Git installed**
  - Test: `git --version`
  - Download if needed: https://git-scm.com/
  
- [ ] **Node.js installed** (optional but recommended)
  - Test: `node --version`
  - Download if needed: https://nodejs.org/
  - Minimum version: 18+
  
- [ ] **PowerShell available**
  - Test: `$PSVersionTable`
  - Should be available by default on Windows

## Quick Start Setup

Run the automated setup script:

- [ ] **Open PowerShell in AI_Orchestration directory**
  ```powershell
  cd C:\Users\Colter\Desktop\Projects\AI_Orchestration
  ```

- [ ] **Run quick-start script**
  ```powershell
  .\quick-start.ps1
  ```

- [ ] **Script completed successfully**
  - No red error messages
  - All green checkmarks
  - "Setup Complete! 🎉" message displayed

## Manual Verification

If quick-start succeeded, these should all be ✓:

- [ ] **Mimir repository cloned**
  - Directory exists: `.\mimir\`
  - Contains package.json
  
- [ ] **.env file created**
  - File exists: `.\.env`
  - Contains NEO4J_PASSWORD
  - Contains HOST_WORKSPACE_ROOT
  
- [ ] **Docker containers running**
  ```powershell
  docker compose ps
  ```
  - mimir_neo4j: Up (healthy)
  - mimir_ollama: Up (healthy)
  - mimir_mcp_server: Up (healthy)
  
- [ ] **Neo4j accessible**
  - URL opens: http://localhost:7474
  - Login works: neo4j / password
  - Database browser loads
  
- [ ] **MCP Server healthy**
  ```powershell
  curl http://localhost:9042/health
  ```
  - Returns: `{"status":"ok"}`
  
- [ ] **Ollama running**
  ```powershell
  curl http://localhost:11434
  ```
  - Returns: "Ollama is running"
  
- [ ] **Embedding model downloaded**
  ```powershell
  docker exec mimir_ollama ollama list
  ```
  - Shows: nomic-embed-text

## Post-Setup Configuration

- [ ] **Review .env file** (optional)
  ```powershell
  notepad .env
  ```
  - NEO4J_PASSWORD: ________________ (change for production!)
  - HOST_WORKSPACE_ROOT: ________________
  - MIMIR_EMBEDDINGS_ENABLED: true ✓
  - MIMIR_EMBEDDINGS_PROVIDER: ollama ✓
  
- [ ] **Install Node dependencies in mimir** (if using file indexing)
  ```powershell
  cd mimir
  npm install
  cd ..
  ```

## First Usage Test

- [ ] **Test MCP tools**
  - Use GitHub Copilot
  - Ask: "Create a TODO in Mimir for testing the system"
  - Copilot should use the `todo` tool
  - Verify in Neo4j Browser
  
- [ ] **Test Neo4j Browser**
  - Open: http://localhost:7474
  - Run query: `MATCH (n) RETURN n LIMIT 25`
  - Should show any created nodes
  
- [ ] **Index first project** (optional)
  ```powershell
  .\mimir-manage.ps1 index C:\Users\Colter\Desktop\Projects\Github\7Days
  ```
  - Indexing completes without errors
  - Files appear in Neo4j Browser
  
- [ ] **Test semantic search**
  - Use GitHub Copilot
  - Ask: "Search Mimir for authentication code"
  - Should return relevant results

## Troubleshooting (if needed)

If any step fails, check these:

### Docker Issues

- [ ] **Docker is running**
  ```powershell
  docker info
  ```
  
- [ ] **No port conflicts**
  ```powershell
  # Check if ports are already in use
  netstat -an | Select-String "7474|7687|9042|11434"
  ```
  
- [ ] **Sufficient disk space**
  - Need at least 5GB free
  - Check: This PC → C: Drive

### Service Issues

- [ ] **Check container logs**
  ```powershell
  docker compose logs
  ```
  - Look for error messages in red
  - Note any "failed" or "error" messages
  
- [ ] **Restart services**
  ```powershell
  docker compose restart
  ```
  
- [ ] **Full restart**
  ```powershell
  docker compose down
  docker compose up -d
  ```

### Network Issues

- [ ] **Firewall not blocking**
  - Check Windows Firewall
  - Allow Docker Desktop
  
- [ ] **VPN/Proxy issues**
  - Try disabling VPN temporarily
  - Add proxy settings to .env if needed

## Learning Path

After setup is complete:

### Day 1: Explore
- [ ] Read README.md
- [ ] Explore Neo4j Browser
- [ ] Try creating memories with Copilot
- [ ] View the graph visualization

### Day 2: Index Projects
- [ ] Index your most important project
- [ ] Test semantic search
- [ ] Create TODOs for your work
- [ ] Link related items

### Day 3: Integration
- [ ] Read INTEGRATION.md
- [ ] Try API calls from PowerShell
- [ ] Create a helper script for your project
- [ ] Set up cross-project relationships

### Week 2: Advanced
- [ ] Read CONFIGURATION.md
- [ ] Configure Claude Desktop (if using)
- [ ] Explore Neo4j Cypher queries
- [ ] Create custom memory types
- [ ] Build knowledge graphs

## Maintenance Checklist

### Daily
- [ ] Check services are running: `.\mimir-manage.ps1 status`
- [ ] No error messages in logs

### Weekly
- [ ] Review disk space usage
- [ ] Check logs for warnings: `docker compose logs | Select-String "warn"`
- [ ] Verify all services healthy: `.\mimir-manage.ps1 health`

### Monthly
- [ ] Update Mimir: `cd mimir; git pull`
- [ ] Rebuild containers: `docker compose build --no-cache`
- [ ] Backup data: `Copy-Item -Recurse data/ backups/`
- [ ] Review and clean old memories

## Success Criteria

You'll know setup is successful when:

✅ All services show `healthy` status  
✅ Neo4j Browser opens and allows login  
✅ MCP health endpoint returns success  
✅ Ollama lists the embedding model  
✅ You can create a TODO via Copilot  
✅ Created TODO appears in Neo4j Browser  
✅ Semantic search returns results  
✅ No error messages in logs  

## Getting Help

If you're stuck:

1. **Check logs first**
   ```powershell
   .\mimir-manage.ps1 logs -Follow
   ```

2. **Review documentation**
   - README.md - Overview and quick start
   - SETUP.md - Detailed setup steps
   - TROUBLESHOOTING section in README

3. **Test health**
   ```powershell
   .\mimir-manage.ps1 health
   ```

4. **Check service status**
   ```powershell
   .\mimir-manage.ps1 status
   ```

5. **Consult resources**
   - Mimir docs: https://github.com/orneryd/Mimir
   - Neo4j docs: https://neo4j.com/docs/
   - Docker docs: https://docs.docker.com/

## Notes

Use this space to track issues, solutions, or customizations:

```
Date: _________
Issue: ___________________________________________
Solution: ________________________________________

Date: _________
Issue: ___________________________________________
Solution: ________________________________________

Date: _________
Customization: ___________________________________
Reason: __________________________________________
```

---

**Setup Date:** _______________  
**Completed By:** _______________  
**Setup Time:** _______ minutes  
**Issues Encountered:** _______________  
**Overall Status:** ⭕ Not Started | 🟡 In Progress | ✅ Complete
