#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Continuous agent orchestrator - spawns agents on a schedule to continuously improve code
.DESCRIPTION
    Runs indefinitely, spawning specialized agents every N minutes to:
    - Review and comment on open PRs
    - Create improvement PRs
    - Fix issues
    - Add tests
    - Update documentation
#>

param(
    [int]$IntervalMinutes = 15,
    [switch]$DryRun
)

$ProjectPath = "C:\Users\Colter\Desktop\Projects\AI_Orchestration"
Set-Location $ProjectPath

Write-Host "🔄 CONTINUOUS AGENT ORCHESTRATOR STARTED" -ForegroundColor Cyan
Write-Host "Spawn Interval: Every $IntervalMinutes minutes" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Agent rotation schedule
$agentRotation = @(
    @{
        Name = "qc"
        Task = "Review ALL open PRs. For each PR: run tests, check coverage (>80%), lint, type-check. Comment with findings. Then find uncovered code and create test PRs."
    },
    @{
        Name = "security"
        Task = "Run Snyk scans on all open PRs and full codebase. Check for secrets, SQL injection, XSS. Create security fix PRs immediately."
    },
    @{
        Name = "janitor"
        Task = "Scan for dead code, unused imports, console.logs, outdated dependencies. Clean them up and create cleanup PRs."
    },
    @{
        Name = "architect"
        Task = "Review open PRs for design patterns, SOLID principles, anti-patterns. Comment with architectural recommendations. Propose refactorings."
    },
    @{
        Name = "devops"
        Task = "Check CI/CD workflows, update dependencies, optimize Docker images, fix failing builds. Create infrastructure improvement PRs."
    },
    @{
        Name = "advocate"
        Task = "Review open PRs critically. Challenge decisions, identify risks, ask 'what could go wrong?', propose alternatives. Comment on every PR."
    }
)

$cycle = 0

while ($true) {
    $cycle++
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🔄 CYCLE #$cycle - $timestamp" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    # Check open PRs
    Write-Host "📋 Checking open PRs..." -ForegroundColor Yellow
    try {
        $openPRs = gh pr list --state open --json number,title,author | ConvertFrom-Json
        Write-Host "   Found $($openPRs.Count) open PRs" -ForegroundColor Gray
        
        foreach ($pr in $openPRs | Select-Object -First 5) {
            Write-Host "   - PR #$($pr.number): $($pr.title)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "   ⚠️  Error checking PRs: $_" -ForegroundColor Red
    }
    Write-Host ""
    
    # Spawn agent for this cycle
    $agentConfig = $agentRotation[$cycle % $agentRotation.Count]
    
    Write-Host "🤖 Spawning Agent: $($agentConfig.Name)" -ForegroundColor Green
    Write-Host "   Task: $($agentConfig.Task)" -ForegroundColor Gray
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "   [DRY RUN] Would spawn: gh agent-task create --custom-agent $($agentConfig.Name)" -ForegroundColor Yellow
    }
    else {
        try {
            $taskDescription = @"
CYCLE #$cycle - $timestamp

$($agentConfig.Task)

Work independently. Create PRs for improvements. Comment on existing PRs with findings.
"@
            
            # Spawn agent (don't follow - let it run async)
            $taskDescription | gh agent-task create --custom-agent $agentConfig.Name -F - 2>&1 | Out-Null
            Write-Host "   ✅ Agent spawned successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "   ❌ Failed to spawn agent: $_" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "⏳ Next cycle in $IntervalMinutes minutes..." -ForegroundColor Gray
    Write-Host ""
    
    # Wait for next cycle
    Start-Sleep -Seconds ($IntervalMinutes * 60)
}
