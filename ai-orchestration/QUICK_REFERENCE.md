# AI_Orchestration - Quick Reference

## 🚀 Quick Start

```powershell
# 1. Ensure services are running
docker-compose up -d

# 2. Verify setup
.\start-orchestration.ps1

# 3. Start orchestration
.\orchestrate.ps1 -Mode auto
```

## 📋 Common Commands

### Orchestration Management
```powershell
# Start automatic orchestration
.\orchestrate.ps1 -Mode auto

# Run single iteration (testing)
.\orchestrate.ps1 -Mode manual

# Monitor only (no spawning)
.\orchestrate.ps1 -Mode monitor

# Custom polling interval
.\orchestrate.ps1 -Mode auto -PollingIntervalSeconds 60
```

### Manual Agent Usage
```powershell
# Start GitHub Copilot CLI
gh copilot

# Switch to PM agent
/agent pm

# Switch to Janitor agent
/agent janitor

# List available agents
/agent [TAB]

# Delegate task to coding agent
/delegate "Implement feature X"
```

### Mimir API
```powershell
# Check health
Invoke-RestMethod http://localhost:9042/health

# List pending tasks
Invoke-RestMethod http://localhost:9042/api/todos?status=pending

# Get specific task
Invoke-RestMethod http://localhost:9042/api/todos/todo-32

# Create task (manual)
Invoke-RestMethod -Uri http://localhost:9042/api/todos -Method POST -Body (@{
    title = "New task"
    description = "Task details"
    status = "pending"
    priority = "high"
} | ConvertTo-Json) -ContentType "application/json"
```

### Docker/Services
```powershell
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View Mimir logs
docker-compose logs -f mimir

# View Neo4j logs
docker-compose logs -f neo4j

# Restart Mimir
docker-compose restart mimir
```

### Git Operations
```powershell
# Pull latest agent definitions
git pull

# Create new agent
# 1. Create .github\agents\myagent.agent.md
# 2. git add .github\agents\myagent.agent.md
# 3. git commit -m "Add MyAgent specialist"
# 4. git push
```

## 🎯 Common Tasks

### Create a Task for an Agent
```powershell
# Via PM agent
gh copilot
/agent pm
> "Create a code cleanup task for Janitor"

# Directly via Mimir API
Invoke-RestMethod -Uri http://localhost:9042/api/todos -Method POST -Body (@{
    title = "Code quality audit"
    description = "Scan for console.log, dead code, unused imports"
    status = "pending"
    tags = @("janitor", "cleanup", "quality")
} | ConvertTo-Json) -ContentType "application/json"
```

### Monitor Orchestration
```powershell
# View orchestrator log (live)
Get-Content logs\orchestration\orchestrator.log -Wait -Tail 20

# View active sessions
Get-ChildItem logs\orchestration\sessions\*.log | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5
```

### Debug Agent Issues
```powershell
# Check running PowerShell jobs
Get-Job

# View job output
Get-Job | Receive-Job

# Kill stuck job
Get-Job | Stop-Job
Get-Job | Remove-Job

# Test agent manually
cd C:\Users\Colter\Desktop\Projects\AI_Orchestration
gh copilot
/agent janitor
> "Test query"
```

## 🔍 Troubleshooting

### "Mimir not responding"
```powershell
docker-compose up -d
Start-Sleep -Seconds 10
Invoke-RestMethod http://localhost:9042/health
```

### "Agent not found"
```powershell
# Pull latest from GitHub
git pull

# Verify agents exist
ls .github\agents\

# Test manually
gh copilot
/agent [TAB]  # Should list available agents
```

### "Orchestrator not processing tasks"
```powershell
# Check orchestrator is running
Get-Process | Where-Object { $_.CommandLine -like "*orchestrate.ps1*" }

# Check logs for errors
Get-Content logs\orchestration\orchestrator.log -Tail 50

# Restart orchestrator
# Press Ctrl+C to stop, then restart
.\orchestrate.ps1 -Mode auto
```

### "Task stuck in pending"
```powershell
# Check task status in Mimir
Invoke-RestMethod http://localhost:9042/api/todos/todo-XX

# Manually update status
Invoke-RestMethod -Uri http://localhost:9042/api/todos/todo-XX -Method PATCH -Body (@{
    status = "in-progress"
} | ConvertTo-Json) -ContentType "application/json"

# Check orchestrator routing
# Look in logs for "Routing task to [agent]"
```

## 📊 Monitoring

### Check System Status
```powershell
# All services
docker-compose ps

# Mimir health
Invoke-RestMethod http://localhost:9042/health

# Neo4j browser
Start-Process http://localhost:7474

# Active orchestration sessions
Get-Content logs\orchestration\orchestrator.log -Tail 1
```

### View Agent Activity
```powershell
# Recent session logs
Get-ChildItem logs\orchestration\sessions\ -Filter "*.log" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 10 Name, LastWriteTime

# Count tasks by status
Invoke-RestMethod http://localhost:9042/api/todos | 
    Group-Object status | 
    Select-Object Name, Count
```

## 🛠️ Configuration

### Update Agent Routing
Edit `orchestrate.ps1` → `Get-AgentForTask` function:
```powershell
$agentMap = @{
    "my|custom|keywords" = "myagent"
}
```

### Adjust Polling Frequency
```powershell
.\orchestrate.ps1 -Mode auto -PollingIntervalSeconds 60
```

### Change Mimir Endpoint
Edit `orchestrate.ps1`:
```powershell
$MIMIR_API = "http://localhost:9042"  # Change if different
```

## 📚 Resources

- **Full Guide:** `ORCHESTRATION_GUIDE.md`
- **Research:** `RESEARCH_FINDINGS_AGENT_DELEGATION.md`
- **Repository:** https://github.com/ColterD/AI_Orchestration
- **Mimir Docs:** `mimir/README.md`
- **GitHub Copilot Docs:** https://docs.github.com/en/copilot

## 🎭 Agent Quick Reference

| Agent | Purpose | Keywords |
|-------|---------|----------|
| `pm` | Task orchestration | planning, coordination, delegation |
| `janitor` | Code cleanup | cleanup, maintenance, docs, console.log |
| `architect` | System design | architecture, design, adr |
| `frontend` | UI development | ui, react, component, typescript |
| `backend` | API development | api, database, server, endpoint |
| `devops` | Infrastructure | docker, deploy, ci/cd, infrastructure |
| `qc` | Quality assurance | test, qa, quality, coverage |

---

**Last Updated:** 2025-11-14  
**Version:** 2.0
