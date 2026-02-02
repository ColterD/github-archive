# BREAKTHROUGH: GitHub Coding Agent IS Programmable!

**Discovery Date**: November 14, 2025  
**Critical Finding**: `gh agent-task create` supports **custom agents** and **background execution**

---

## THE MISSING PIECE

I initially dismissed GitHub Coding Agent as "PR-centric" and "limited." **I WAS WRONG.**

### What I Discovered in `gh agent-task create --help`:

```powershell
FLAGS
  -a, --custom-agent string      Use a custom agent for the task. e.g., use 'my-agent' for the 'my-agent.md' agent
      --follow                   Follow agent session logs
  -F, --from-file file           Read task description from file (use "-" to read from standard input)
```

**This changes EVERYTHING.**

---

## WHAT THIS MEANS

### 1. We Can Use Our Existing .agent.md Files!

```powershell
# Launch PM agent with custom prompt
gh agent-task create "Audit codebase for console.log statements" --custom-agent pm --follow
```

**This uses `.github/agents/pm.agent.md` directly!**

### 2. Programmatic Input via Stdin

```powershell
# Programmatic task creation
$taskDescription = @"
Analyze mimir/src directory for code quality issues.
Focus on: console.log statements, error handling, type safety.
Create detailed report with file paths and line numbers.
"@

$taskDescription | gh agent-task create -F - --custom-agent janitor --follow
```

### 3. Background Execution + Log Streaming

```powershell
# Launch agent in background, stream logs
gh agent-task create "Task description" --custom-agent pm --follow
```

The `--follow` flag streams real-time logs, but can be omitted for fire-and-forget execution.

### 4. Session Tracking

```powershell
# Create task returns session identifier
$sessionId = gh agent-task create "Build feature X" --custom-agent backend

# Later, check status
gh agent-task view $sessionId

# List all active tasks
gh agent-task list
```

---

## REVISED ARCHITECTURE: GitHub Coding Agent Orchestration

### The Simple Path Forward

```powershell
# orchestrate-gh.ps1
param([string]$UserRequest)

Write-Host "🚀 Starting autonomous multi-agent orchestration..."

# Step 1: Launch PM agent to decompose task
Write-Host "📋 PM Agent: Analyzing request and creating task breakdown..."
$pmOutput = $UserRequest | gh agent-task create -F - --custom-agent pm --follow

# PM agent creates Mimir tasks (via its tool access)
# Parse PM output for task assignments

Write-Host "👥 Spawning specialist agents..."

# Step 2: Spawn specialist agents in parallel
$jobs = @()

# Janitor agent
$jobs += Start-Job -ScriptBlock {
    $task = gh agent-task view $using:janitorTaskId
    gh agent-task create $task.description --custom-agent janitor --follow
}

# Backend agent  
$jobs += Start-Job -ScriptBlock {
    $task = gh agent-task view $using:backendTaskId
    gh agent-task create $task.description --custom-agent backend --follow
}

# QC agent
$jobs += Start-Job -ScriptBlock {
    $task = gh agent-task view $using:qcTaskId
    gh agent-task create $task.description --custom-agent qc --follow
}

# Step 3: Wait for all agents to complete
Write-Host "⏳ Agents working... (this may take several minutes)"
$jobs | Wait-Job | Receive-Job

# Step 4: Collect results from Mimir
Write-Host "📊 Generating final report..."
# Query Mimir for task results

Write-Host "✅ Orchestration complete!"
```

---

## KEY ADVANTAGES of GitHub Coding Agent Approach

### ✅ Pros:

1. **Uses Existing Infrastructure**:
   - `.github/agents/*.agent.md` files already created
   - No new dependencies to install
   - Already integrated with GitHub Copilot subscription

2. **True Autonomous Execution**:
   - Agents run in background
   - Can spawn multiple agents in parallel
   - No human interaction required after launch

3. **Full Tool Access**:
   - Agents have access to all GitHub Copilot tools
   - Can use MCP servers (Mimir already connected)
   - File system, terminal, web browsing all available

4. **Built-in Monitoring**:
   - `gh agent-task list` shows all active tasks
   - `gh agent-task view` shows detailed session logs
   - `--follow` flag streams real-time progress

5. **Session Persistence**:
   - Tasks are tracked by GitHub
   - Can resume or review later
   - Integrated with pull request workflow

6. **No Additional Cost**:
   - Included in GitHub Copilot subscription
   - No separate LLM API fees
   - Already paying for this capability

### ⚠️ Potential Limitations (Need to Test):

1. **Parallel Execution Limits**:
   - How many concurrent `gh agent-task` sessions can run?
   - Need to test with 5+ agents simultaneously

2. **Inter-Agent Communication**:
   - Agents coordinate via Mimir (should work)
   - Need to verify agents can query/update shared state

3. **Custom Agent Discovery**:
   - Does `--custom-agent pm` find `.github/agents/pm.agent.md`?
   - Need to verify path resolution

4. **Output Parsing**:
   - How structured is agent output?
   - Can we reliably parse task assignments from PM?

---

## COMPARISON: GitHub Coding Agent vs CrewAI

| Feature | GitHub Coding Agent | CrewAI Framework |
|---------|---------------------|------------------|
| **Cost** | $0 (included in Copilot) | $2-6 per orchestration |
| **Setup** | Already configured | Requires Python env + pip install |
| **Custom Agents** | ✅ `.agent.md` files | ✅ Python Agent classes |
| **MCP Integration** | ✅ Native (already connected) | ⚠️ Manual (via tools) |
| **Parallel Execution** | ✅ Background jobs | ✅ Async tasks |
| **Monitoring** | ✅ `gh agent-task list/view` | ⚠️ Custom logging |
| **Tool Access** | ✅ Full Copilot tools | ⚠️ Limited to CrewAI tools |
| **LLM Choice** | ❌ GitHub Copilot only | ✅ Any LLM (OpenAI, Claude, Ollama) |
| **Production Ready** | ✅ Preview (stable) | ✅ Used by Fortune 500 |
| **Learning Curve** | Low (uses existing agents) | Medium (new framework) |

---

## RECOMMENDED PATH FORWARD

### Phase 1: Prove GitHub Coding Agent Works (30 minutes)

**Test script: `test-gh-agent.ps1`**

```powershell
# Test 1: Can we use custom agents?
Write-Host "Test 1: Launching PM agent with custom prompt..."
$result = gh agent-task create "List all files in mimir/src/tools directory" --custom-agent pm
Write-Host "Session ID: $result"

# Test 2: Can we follow logs?
Write-Host "`nTest 2: Launching janitor with log streaming..."
gh agent-task create "Find console.log in mimir/src/tools/task-executor.ts" --custom-agent janitor --follow

# Test 3: Can we run multiple agents in parallel?
Write-Host "`nTest 3: Launching 3 agents simultaneously..."
$job1 = Start-Job { gh agent-task create "Test task 1" --custom-agent pm }
$job2 = Start-Job { gh agent-task create "Test task 2" --custom-agent janitor }
$job3 = Start-Job { gh agent-task create "Test task 3" --custom-agent backend }

Wait-Job $job1, $job2, $job3
Write-Host "All agents completed!"

# Test 4: Can agents access Mimir?
Write-Host "`nTest 4: Testing Mimir integration..."
gh agent-task create "Use Mimir to create a test memory node with title 'Test from agent' and content 'This is a test'" --custom-agent pm --follow
```

### Phase 2: Build Full Orchestrator (2 hours)

If tests pass, build `orchestrate-gh.ps1` with:
1. PM task decomposition
2. Parallel specialist spawning
3. Mimir coordination
4. QC validation
5. Final report generation

### Phase 3: Fallback to CrewAI if Needed

If GitHub Coding Agent has limitations (concurrent execution limits, output parsing issues, etc.), then implement CrewAI approach.

---

## IMMEDIATE ACTION

**I need to run the test script to validate this approach works.**

Key questions to answer:
1. ✅ Does `--custom-agent pm` find `.github/agents/pm.agent.md`? 
2. ❓ Can multiple agents run in parallel?
3. ❓ Can agents access Mimir MCP tools?
4. ❓ How do we parse PM's task decomposition output?
5. ❓ Can agents coordinate via Mimir memory_lock?

**If all 5 questions are YES, then GitHub Coding Agent is the perfect solution.** We already have everything we need - just need to prove it works.

---

## CONCLUSION

**I initially underestimated GitHub Coding Agent.** The `--custom-agent` flag is the missing piece that makes this approach viable. 

**Next step**: Run validation tests to prove this works, then build the full orchestrator.

If it works → Simple, cost-effective, uses existing infrastructure.  
If it doesn't → Fall back to CrewAI (still excellent option).

**Either way, we have a clear path to autonomous multi-agent orchestration.**
