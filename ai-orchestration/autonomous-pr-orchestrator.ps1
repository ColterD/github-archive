#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Intelligent autonomous PR orchestrator with diagnostic and self-healing capabilities
.DESCRIPTION
    Continuously monitors PRs, diagnoses failures, orchestrates agents to fix issues,
    and auto-merges when all checks pass. Prevents infinite rerun loops.
#>

param(
    [int]$DurationHours = 12,
    [int]$CheckIntervalSeconds = 90
)

$ErrorActionPreference = "Continue"
$StartTime = Get-Date
$EndTime = $StartTime.AddHours($DurationHours)
$IterationCount = 0

# Track PR states to prevent infinite loops
$script:PRStates = @{}
$script:LastFixAttempt = @{}
$script:FixCooldownMinutes = 30

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Get-TimeRemaining {
    $remaining = $EndTime - (Get-Date)
    return "{0:D2}h {1:D2}m {2:D2}s" -f $remaining.Hours, $remaining.Minutes, $remaining.Seconds
}

function Get-PRCheckSummary {
    param([int]$PRNumber)
    
    try {
        $prData = gh pr view $PRNumber --json number,title,author,state,statusCheckRollup,mergeable,headRefName,updatedAt,url 2>$null | ConvertFrom-Json
        
        if (-not $prData) { return $null }
        
        $checks = @{
            Total = 0
            Passed = 0
            Failed = 0
            Pending = 0
        }
        
        if ($prData.statusCheckRollup) {
            $checks.Total = $prData.statusCheckRollup.Count
            $checks.Passed = ($prData.statusCheckRollup | Where-Object { $_.conclusion -eq 'SUCCESS' }).Count
            $checks.Failed = ($prData.statusCheckRollup | Where-Object { $_.conclusion -eq 'FAILURE' }).Count
            $checks.Pending = ($prData.statusCheckRollup | Where-Object { $_.status -in @('IN_PROGRESS', 'QUEUED', 'PENDING') }).Count
        }
        
        return @{
            Number = $prData.number
            Title = $prData.title
            Author = $prData.author.login
            Branch = $prData.headRefName
            Mergeable = $prData.mergeable
            UpdatedAt = [DateTime]::Parse($prData.updatedAt)
            URL = $prData.url
            Checks = $checks
            FailingChecks = $prData.statusCheckRollup | Where-Object { $_.conclusion -eq 'FAILURE' }
        }
    } catch {
        Write-Log "  ⚠️  Error getting PR #$PRNumber details: $($_.Exception.Message)" "Yellow"
        return $null
    }
}

function Should-SkipPR {
    param([hashtable]$PRInfo)
    
    $prKey = "PR_$($PRInfo.Number)"
    
    # Check if we've recently attempted a fix
    if ($script:LastFixAttempt.ContainsKey($prKey)) {
        $timeSinceLastFix = (Get-Date) - $script:LastFixAttempt[$prKey]
        if ($timeSinceLastFix.TotalMinutes -lt $script:FixCooldownMinutes) {
            Write-Log "    ⏸️  Cooldown active ($([Math]::Round($timeSinceLastFix.TotalMinutes, 1))/$script:FixCooldownMinutes min)" "Gray"
            return $true
        }
    }
    
    return $false
}

function Get-FailureReason {
    param([string]$Branch)
    
    try {
        $recentRuns = gh run list --branch $Branch --limit 3 --json databaseId,conclusion,name,createdAt 2>$null | ConvertFrom-Json
        $failedRun = $recentRuns | Where-Object { $_.conclusion -eq 'failure' } | Select-Object -First 1
        
        if ($failedRun) {
            $logs = gh run view $failedRun.databaseId --log 2>&1 | Out-String
            
            # Analyze logs for common failure patterns
            if ($logs -match "Setup Node.js.*unable to cache dependencies") {
                return "Missing package-lock.json or cache configuration issue"
            } elseif ($logs -match "npm ci.*ENOENT") {
                return "Missing dependencies or package.json issue"
            } elseif ($logs -match "npm test.*FAIL") {
                return "Test failures - code changes needed"
            } elseif ($logs -match "npm run build.*error") {
                return "Build/compilation errors"
            } elseif ($logs -match "SNYK.*ERROR") {
                return "Security vulnerabilities detected by Snyk"
            } else {
                return "Unknown test failure - see logs at run $($failedRun.databaseId)"
            }
        }
    } catch {
        return "Could not determine failure reason"
    }
    
    return "No recent failures found"
}

function Spawn-FixAgent {
    param(
        [hashtable]$PRInfo,
        [string]$FailureReason
    )
    
    Write-Log "  🤖 Spawning DevOps agent to fix PR #$($PRInfo.Number)..." "Cyan"
    
    $fixTask = @"
AUTO-FIX REQUIRED for PR #$($PRInfo.Number)

**PR Information:**
- Title: $($PRInfo.Title)
- Branch: $($PRInfo.Branch)
- URL: $($PRInfo.URL)
- Author: $($PRInfo.Author)

**Problem Detected:**
$FailureReason

**Failing Checks:**
$($PRInfo.FailingChecks | ForEach-Object { "- $($_.name)" } | Out-String)

**Required Actions:**
1. Checkout branch: git checkout $($PRInfo.Branch)
2. Analyze the specific test failures
3. Fix the root cause (DO NOT just skip tests)
4. Run tests locally to verify fix
5. Commit with descriptive message
6. Push changes

**Success Criteria:**
- All tests pass
- No new issues introduced
- Code follows project patterns
- PR is ready for merge

**CRITICAL:** Fix the actual issue, don't work around it!
"@
    
    try {
        $result = $fixTask | gh agent-task create --custom-agent devops --follow -F - 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "    ✅ Fix task created - DevOps agent working on it" "Green"
            $script:LastFixAttempt["PR_$($PRInfo.Number)"] = Get-Date
            return $true
        } else {
            Write-Log "    ❌ Failed to create fix task" "Red"
            return $false
        }
    } catch {
        Write-Log "    ❌ Error creating fix task: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Merge-ReadyPR {
    param([hashtable]$PRInfo)
    
    if ($PRInfo.Checks.Failed -eq 0 -and $PRInfo.Checks.Pending -eq 0 -and $PRInfo.Checks.Total -gt 0) {
        if ($PRInfo.Mergeable -eq 'MERGEABLE') {
            Write-Log "  🎉 All checks passed! Merging PR #$($PRInfo.Number)..." "Green"
            
            try {
                gh pr merge $PRInfo.Number --auto --squash --delete-branch 2>&1 | Out-Null
                Write-Log "    ✅ PR #$($PRInfo.Number) merged successfully!" "Green"
                
                # Clear tracking for this PR
                $script:PRStates.Remove("PR_$($PRInfo.Number)")
                $script:LastFixAttempt.Remove("PR_$($PRInfo.Number)")
                
                return $true
            } catch {
                Write-Log "    ❌ Merge failed: $($_.Exception.Message)" "Red"
                return $false
            }
        } else {
            Write-Log "  ⚠️  PR not mergeable - conflicts or branch protection" "Yellow"
            return $false
        }
    }
    
    return $false
}

function Process-PR {
    param([int]$PRNumber)
    
    $prInfo = Get-PRCheckSummary -PRNumber $PRNumber
    if (-not $prInfo) { return }
    
    $prKey = "PR_$PRNumber"
    $checks = $prInfo.Checks
    
    Write-Log "`n📋 PR #$PRNumber: $($prInfo.Title.Substring(0, [Math]::Min(60, $prInfo.Title.Length)))..." "Cyan"
    Write-Log "  👤 Author: $($prInfo.Author)" "Gray"
    Write-Log "  📊 Checks: ✓$($checks.Passed) ⏳$($checks.Pending) ✗$($checks.Failed) (Total: $($checks.Total))" "White"
    
    # State 1: No checks have run yet
    if ($checks.Total -eq 0) {
        Write-Log "  ⏳ Waiting for checks to start..." "Yellow"
        return
    }
    
    # State 2: Checks are running
    if ($checks.Pending -gt 0) {
        Write-Log "  ⏳ Tests in progress..." "Yellow"
        return
    }
    
    # State 3: All checks passed - MERGE!
    if ($checks.Failed -eq 0 -and $checks.Total -gt 0) {
        Write-Log "  ✅ ALL CHECKS PASSED!" "Green"
        if (Merge-ReadyPR -PRInfo $prInfo) {
            Write-Log "  🎊 PR merged and branch deleted!" "Green"
        }
        return
    }
    
    # State 4: Checks are failing - DIAGNOSE AND FIX
    if ($checks.Failed -gt 0) {
        Write-Log "  ❌ $($checks.Failed) failing checks detected" "Red"
        
        # Check cooldown to prevent spam
        if (Should-SkipPR -PRInfo $prInfo) {
            return
        }
        
        # Diagnose the failure
        Write-Log "  🔍 Diagnosing failure..." "Cyan"
        $failureReason = Get-FailureReason -Branch $prInfo.Branch
        Write-Log "  📝 Diagnosis: $failureReason" "Yellow"
        
        # Spawn fix agent
        if (Spawn-FixAgent -PRInfo $prInfo -FailureReason $failureReason) {
            Write-Log "  ✅ Fix agent spawned - will recheck in $script:FixCooldownMinutes minutes" "Green"
        }
    }
}

function Display-Dashboard {
    param([hashtable]$Stats)
    
    Clear-Host
    Write-Host "`n╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║            🤖 AUTONOMOUS PR ORCHESTRATOR v2.0 🤖                    ║" -ForegroundColor Cyan
    Write-Host "╠══════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  Iteration: $($IterationCount.ToString().PadLeft(4))                                                       ║" -ForegroundColor White
    Write-Host "║  Runtime: $($Stats.Runtime.PadRight(20))  Remaining: $($Stats.Remaining.PadRight(15))   ║" -ForegroundColor White
    Write-Host "╠══════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  📋 Open PRs: $($Stats.TotalPRs.ToString().PadLeft(3))  |  🤖 Bot PRs: $($Stats.BotPRs.ToString().PadLeft(3))  |  ⏸️  In Cooldown: $($Stats.InCooldown.ToString().PadLeft(2))    ║" -ForegroundColor White
    Write-Host "║  ✅ Ready to Merge: $($Stats.ReadyToMerge.ToString().PadLeft(2))                                              ║" -ForegroundColor Green
    Write-Host "║  ⏳ Tests Running: $($Stats.InProgress.ToString().PadLeft(2))                                               ║" -ForegroundColor Yellow
    Write-Host "║  ❌ Failing Tests: $($Stats.Failing.ToString().PadLeft(2))                                               ║" -ForegroundColor Red
    Write-Host "╠══════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  🔧 Fix Agents Spawned: $($Stats.FixesSpawned.ToString().PadLeft(3))                                        ║" -ForegroundColor Cyan
    Write-Host "║  🎉 PRs Merged: $($Stats.Merged.ToString().PadLeft(3))                                                   ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# Main execution loop
Write-Log "`n🚀 STARTING AUTONOMOUS PR ORCHESTRATOR" "Cyan"
Write-Log "══════════════════════════════════════════════════════════════════" "Cyan"
Write-Log "Duration: $DurationHours hours | Check Interval: $CheckIntervalSeconds seconds" "White"
Write-Log "Fix Cooldown: $script:FixCooldownMinutes minutes (prevents rerun loops)" "White"
Write-Log "══════════════════════════════════════════════════════════════════`n" "Cyan"

$totalStats = @{
    FixesSpawned = 0
    Merged = 0
}

while ((Get-Date) -lt $EndTime) {
    $IterationCount++
    
    Write-Log "`n━━━━━━━━━━━━━━━━━ ITERATION $IterationCount ━━━━━━━━━━━━━━━━━" "Cyan"
    
    # Get all open PRs
    try {
        $openPRs = gh pr list --json number --limit 50 2>$null | ConvertFrom-Json
        
        $stats = @{
            TotalPRs = $openPRs.Count
            BotPRs = 0
            ReadyToMerge = 0
            InProgress = 0
            Failing = 0
            InCooldown = 0
            FixesSpawned = $totalStats.FixesSpawned
            Merged = $totalStats.Merged
            Runtime = (Get-Date) - $StartTime | ForEach-Object { "{0:D2}h {1:D2}m" -f $_.Hours, $_.Minutes }
            Remaining = Get-TimeRemaining
        }
        
        Write-Log "📊 Processing $($openPRs.Count) open PRs..." "Cyan"
        
        foreach ($pr in $openPRs) {
            $prInfo = Get-PRCheckSummary -PRNumber $pr.number
            
            if (-not $prInfo) { continue }
            
            # Count bot PRs
            if ($prInfo.Author -like "*copilot*") {
                $stats.BotPRs++
            }
            
            # Categorize
            if ($prInfo.Checks.Pending -gt 0) {
                $stats.InProgress++
            } elseif ($prInfo.Checks.Failed -gt 0) {
                $stats.Failing++
                if (Should-SkipPR -PRInfo $prInfo) {
                    $stats.InCooldown++
                }
            } elseif ($prInfo.Checks.Failed -eq 0 -and $prInfo.Checks.Total -gt 0) {
                $stats.ReadyToMerge++
            }
        }
        
        # Display dashboard
        Display-Dashboard -Stats $stats
        
        # Process each PR
        foreach ($pr in $openPRs) {
            $prInfoBefore = Get-PRCheckSummary -PRNumber $pr.number
            if ($prInfoBefore -and $prInfoBefore.Checks.Failed -gt 0 -and -not (Should-SkipPR -PRInfo $prInfoBefore)) {
                # Only spawn fix if failing and not in cooldown
                Process-PR -PRNumber $pr.number
                $totalStats.FixesSpawned++
            } elseif ($prInfoBefore -and $prInfoBefore.Checks.Failed -eq 0 -and $prInfoBefore.Checks.Total -gt 0) {
                # Merge if ready
                if (Merge-ReadyPR -PRInfo $prInfoBefore) {
                    $totalStats.Merged++
                }
            } else {
                # Just log status
                Process-PR -PRNumber $pr.number
            }
            
            Start-Sleep -Milliseconds 500
        }
        
    } catch {
        Write-Log "❌ Error in main loop: $($_.Exception.Message)" "Red"
    }
    
    Write-Log "`n⏱️  Sleeping for $CheckIntervalSeconds seconds..." "Gray"
    Start-Sleep -Seconds $CheckIntervalSeconds
}

Write-Log "`n🎊 ORCHESTRATOR COMPLETED!" "Green"
Write-Log "══════════════════════════════════════════════════════════════════" "Green"
Write-Log "Total Fix Agents Spawned: $($totalStats.FixesSpawned)" "White"
Write-Log "Total PRs Merged: $($totalStats.Merged)" "White"
Write-Log "══════════════════════════════════════════════════════════════════`n" "Green"
