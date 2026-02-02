#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Spawn agents to review ALL open PRs right now
.DESCRIPTION
    One-time spawn of multiple agents to review current open PRs
#>

param(
    [switch]$DryRun
)

$ProjectPath = "C:\Users\Colter\Desktop\Projects\AI_Orchestration"
Set-Location $ProjectPath

Write-Host "🔍 PR REVIEW AGENT SWARM" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Get open PRs
$openPRs = gh pr list --state open --json number,title,author | ConvertFrom-Json

Write-Host "Found $($openPRs.Count) open PRs to review:" -ForegroundColor Yellow
foreach ($pr in $openPRs | Select-Object -First 10) {
    Write-Host "  - PR #$($pr.number): $($pr.title)" -ForegroundColor Gray
}
Write-Host ""

if ($openPRs.Count -eq 0) {
    Write-Host "✅ No open PRs to review" -ForegroundColor Green
    exit 0
}

# Spawn specialized reviewers
$reviewers = @(
    @{
        Name = "qc"
        Focus = "Run tests, check coverage, validate quality standards"
    },
    @{
        Name = "security"
        Focus = "Run Snyk scans, check for vulnerabilities, validate security"
    },
    @{
        Name = "architect"
        Focus = "Review design patterns, architecture, SOLID principles"
    },
    @{
        Name = "advocate"
        Focus = "Challenge decisions, identify risks, propose alternatives"
    }
)

foreach ($reviewer in $reviewers) {
    Write-Host "🚀 Spawning: $($reviewer.Name)" -ForegroundColor Green
    Write-Host "   Focus: $($reviewer.Focus)" -ForegroundColor Gray
    
    $prList = ($openPRs | ForEach-Object { "#$($_.number)" }) -join ", "
    
    $task = @"
Review these open PRs: $prList

For EACH PR:
1. Read the PR description and changes
2. Analyze based on your specialty: $($reviewer.Focus)
3. Comment directly on the PR with specific findings
4. Provide actionable recommendations
5. Request changes if issues found, or approve if good

Be thorough. Comment on EVERY PR in the list.
"@
    
    if ($DryRun) {
        Write-Host "   [DRY RUN] Would spawn with task" -ForegroundColor Yellow
    }
    else {
        try {
            $task | gh agent-task create --custom-agent $reviewer.Name -F - 2>&1 | Out-Null
            Write-Host "   ✅ Spawned" -ForegroundColor Green
        }
        catch {
            Write-Host "   ❌ Failed: $_" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Review agents spawned for $($openPRs.Count) PRs" -ForegroundColor Green
Write-Host ""
Write-Host "Monitor progress with: gh pr list" -ForegroundColor Cyan
Write-Host ""
