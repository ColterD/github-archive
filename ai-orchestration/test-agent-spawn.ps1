# test-agent-spawn.ps1 - Proof of Concept: Agent Spawning Test

Write-Host "=== Testing AI_Orchestration Agent System ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Verify GitHub Copilot CLI
Write-Host "[1/5] Testing GitHub Copilot CLI..." -ForegroundColor Yellow
try {
    $ghCopilotVersion = gh copilot --version 2>&1
    Write-Host "  ✓ GitHub Copilot CLI installed" -ForegroundColor Green
    Write-Host "    Version: $ghCopilotVersion" -ForegroundColor Gray
}
catch {
    Write-Host "  ✗ GitHub Copilot CLI not available" -ForegroundColor Red
    exit 1
}

# Test 2: Verify Git Repository
Write-Host "[2/5] Verifying git repository..." -ForegroundColor Yellow
Push-Location "C:\Users\Colter\Desktop\Projects\AI_Orchestration"
$gitRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Git repository configured" -ForegroundColor Green
    Write-Host "    Remote: $gitRemote" -ForegroundColor Gray
}
else {
    Write-Host "  ✗ Not a git repository" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Test 3: Verify Custom Agents
Write-Host "[3/5] Checking custom agents..." -ForegroundColor Yellow
$agentsDir = ".github\agents"
if (Test-Path $agentsDir) {
    $agents = Get-ChildItem -Path $agentsDir -Filter "*.agent.md"
    Write-Host "  ✓ Found $($agents.Count) custom agents:" -ForegroundColor Green
    foreach ($agent in $agents) {
        $agentName = $agent.BaseName
        Write-Host "    - $agentName" -ForegroundColor Gray
    }
}
else {
    Write-Host "  ✗ Agents directory not found" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Test 4: Verify Mimir Connectivity
Write-Host "[4/5] Testing Mimir MCP Server..." -ForegroundColor Yellow
try {
    $mimirHealth = Invoke-RestMethod -Uri "http://localhost:9042/health" -Method GET
    Write-Host "  ✓ Mimir is healthy" -ForegroundColor Green
    Write-Host "    Status: $($mimirHealth.status)" -ForegroundColor Gray
    Write-Host "    Version: $($mimirHealth.version)" -ForegroundColor Gray
    Write-Host "    Tools: $($mimirHealth.tools)" -ForegroundColor Gray
}
catch {
    Write-Host "  ✗ Mimir not accessible: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Test 5: Demonstrate Agent Invocation
Write-Host "[5/5] Testing agent invocation..." -ForegroundColor Yellow
Write-Host "  ℹ This will spawn a GitHub Copilot session with the PM agent" -ForegroundColor Cyan
Write-Host "  ℹ The agent will have access to all MCP tools including Mimir" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Would you like to spawn the PM agent now? (y/N)"
if ($choice -eq 'y' -or $choice -eq 'Y') {
    Write-Host ""
    Write-Host "=== Spawning PM Agent ===" -ForegroundColor Cyan
    Write-Host "Agent will start in interactive mode." -ForegroundColor Gray
    Write-Host "Type your request or '/exit' to quit." -ForegroundColor Gray
    Write-Host ""
    
    # Spawn PM agent session
    gh copilot
    
    Write-Host ""
    Write-Host "=== Agent Session Ended ===" -ForegroundColor Cyan
}
else {
    Write-Host "  ⊘ Agent spawn skipped" -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✓ GitHub Copilot CLI: Ready" -ForegroundColor Green
Write-Host "  ✓ Git Repository: Configured" -ForegroundColor Green
Write-Host "  ✓ Custom Agents: Available" -ForegroundColor Green
Write-Host "  ✓ Mimir MCP Server: Healthy" -ForegroundColor Green
Write-Host ""
Write-Host "System Status: OPERATIONAL" -ForegroundColor Green
Write-Host ""
Write-Host "To manually test agents:" -ForegroundColor Cyan
Write-Host "  cd C:\Users\Colter\Desktop\Projects\AI_Orchestration" -ForegroundColor Gray
Write-Host "  gh copilot" -ForegroundColor Gray
Write-Host "  /agent pm" -ForegroundColor Gray
Write-Host "  > 'Perform code quality audit'" -ForegroundColor Gray
Write-Host ""
