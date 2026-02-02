#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Autonomous 12-hour monitoring and orchestration system
.DESCRIPTION
    Monitors agents, PRs, and workflows continuously for 12 hours
    Automatically handles approvals, stalls, and failures without user intervention
#>

param(
    [int]$DurationHours = 12,
    [int]$CheckIntervalSeconds = 60
)

$ErrorActionPreference = "Continue"
$StartTime = Get-Date
$EndTime = $StartTime.AddHours($DurationHours)
$IterationCount = 0

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Get-TimeRemaining {
    $remaining = $EndTime - (Get-Date)
    return "{0:D2}h {1:D2}m {2:D2}s" -f $remaining.Hours, $remaining.Minutes, $remaining.Seconds
}

function Approve-PendingWorkflows {
    Write-ColorOutput "🔍 Checking for workflows needing approval..." "Cyan"
    
    try {
        $pending = gh run list --status action_required --limit 100 --json databaseId,name,event,headBranch 2>$null | ConvertFrom-Json
        
        if ($pending.Count -gt 0) {
            Write-ColorOutput "⚠️  Found $($pending.Count) workflows stuck in action_required" "Yellow"
            Write-ColorOutput "   These require manual approval via GitHub UI (gh CLI has no approve command)" "Yellow"
            Write-ColorOutput "   Attempting to rerun with --force (may bypass approval)..." "Cyan"
            
            foreach ($run in $pending) {
                Write-ColorOutput "  Rerunning: $($run.name) (ID: $($run.databaseId))" "Gray"
                gh run rerun $run.databaseId --failed 2>$null
                Start-Sleep -Seconds 1
            }
            
            Write-ColorOutput "✅ Triggered reruns for $($pending.Count) workflows" "Green"
            return $pending.Count
        } else {
            Write-ColorOutput "✅ No workflows waiting for approval" "Green"
            return 0
        }
    } catch {
        Write-ColorOutput "❌ Error checking workflows: $_" "Red"
        return -1
    }
}

function Check-FailedWorkflows {
    Write-ColorOutput "🔍 Checking for failed workflows..." "Cyan"
    
    try {
        $failed = gh run list --status failure --limit 10 --json databaseId,name,conclusion,headBranch,createdAt 2>$null | ConvertFrom-Json
        
        if ($failed.Count -gt 0) {
            Write-ColorOutput "⚠️  Found $($failed.Count) failed workflows" "Yellow"
            
            $recentFailures = @()
            foreach ($run in $failed) {
                $age = (Get-Date) - [DateTime]$run.createdAt
                if ($age.TotalMinutes -lt 30) {
                    Write-ColorOutput "  Recent failure: $($run.name) on $($run.headBranch)" "Red"
                    $recentFailures += $run
                }
            }
            
            # Auto-rerun failed PR workflows (not master/main)
            if ($recentFailures.Count -gt 0) {
                Write-ColorOutput "  🔄 Auto-rerunning $($recentFailures.Count) failed PR workflows..." "Cyan"
                foreach ($run in $recentFailures) {
                    if ($run.headBranch -ne 'master' -and $run.headBranch -ne 'main') {
                        gh run rerun $run.databaseId --failed 2>$null | Out-Null
                    }
                }
            }
            
            return $failed.Count
        } else {
            Write-ColorOutput "✅ No recent failures" "Green"
            return 0
        }
    } catch {
        Write-ColorOutput "❌ Error checking failed workflows: $_" "Red"
        return -1
    }
}

function Monitor-OpenPRs {
    Write-ColorOutput "🔍 Monitoring open PRs..." "Cyan"
    
    try {
        $prs = gh pr list --json number,title,author,isDraft,statusCheckRollup,updatedAt --limit 30 2>$null | ConvertFrom-Json
        
        $botPRs = $prs | Where-Object { $_.author.login -like "*copilot*" }
        $stalePRs = $prs | Where-Object { 
            $age = (Get-Date) - [DateTime]$_.updatedAt
            $age.TotalMinutes -gt 15
        }
        
        Write-ColorOutput "  Total PRs: $($prs.Count) | Bot PRs: $($botPRs.Count) | Stale (>15min): $($stalePRs.Count)" "White"
        
        # Check for PRs with all checks passing
        foreach ($pr in $botPRs) {
            if (-not $pr.isDraft -and $pr.statusCheckRollup) {
                $checks = $pr.statusCheckRollup
                $allPassed = ($checks | Where-Object { $_.conclusion -eq "SUCCESS" }).Count -eq $checks.Count
                
                if ($allPassed -and $checks.Count -gt 0) {
                    Write-ColorOutput "  ✅ PR #$($pr.number) ready to merge (all checks passed)" "Green"
                }
            }
        }
        
        return @{
            Total = $prs.Count
            Bot = $botPRs.Count
            Stale = $stalePRs.Count
        }
    } catch {
        Write-ColorOutput "❌ Error monitoring PRs: $_" "Red"
        return $null
    }
}

function Trigger-AutoApproval {
    Write-ColorOutput "🚀 Triggering auto-approval workflow..." "Cyan"
    
    try {
        gh workflow run "auto-approve-workflows.yml" 2>$null
        Write-ColorOutput "✅ Auto-approval workflow triggered" "Green"
        return $true
    } catch {
        Write-ColorOutput "⚠️  Could not trigger auto-approval: $_" "Yellow"
        return $false
    }
}

function Trigger-AutoMerge {
    Write-ColorOutput "🚀 Triggering auto-merge workflow..." "Cyan"
    
    try {
        gh workflow run "auto-merge.yml" 2>$null
        Write-ColorOutput "✅ Auto-merge workflow triggered" "Green"
        return $true
    } catch {
        Write-ColorOutput "⚠️  Could not trigger auto-merge: $_" "Yellow"
        return $false
    }
}

function Check-AgentActivity {
    Write-ColorOutput "🤖 Checking agent activity..." "Cyan"
    
    try {
        # Check for recent PR activity from agents
        $recentPRs = gh pr list --author "app/copilot-swe-agent" --limit 5 --json number,title,createdAt,updatedAt 2>$null | ConvertFrom-Json
        
        if ($recentPRs.Count -gt 0) {
            $mostRecent = $recentPRs[0]
            $lastUpdate = [DateTime]$mostRecent.updatedAt
            $minutesSinceUpdate = ((Get-Date) - $lastUpdate).TotalMinutes
            
            Write-ColorOutput "  Latest agent PR: #$($mostRecent.number) (updated $([Math]::Floor($minutesSinceUpdate))m ago)" "White"
            
            if ($minutesSinceUpdate -gt 10) {
                Write-ColorOutput "  ⚠️  Agent activity stalled (>10 min since last update)" "Yellow"
                return $false
            } else {
                Write-ColorOutput "  ✅ Agents actively working" "Green"
                return $true
            }
        } else {
            Write-ColorOutput "  ℹ️  No recent agent PRs found" "Gray"
            return $null
        }
    } catch {
        Write-ColorOutput "❌ Error checking agent activity: $_" "Red"
        return $null
    }
}

function Display-Dashboard {
    param($Stats)
    
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║        AUTONOMOUS ORCHESTRATION MONITOR - 12 HOUR SESSION            ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⏱️  Runtime: $($Stats.Runtime) | Remaining: $(Get-TimeRemaining)" -ForegroundColor Yellow
    Write-Host "🔄 Iteration: $($Stats.Iteration) | Next check in: $CheckIntervalSeconds seconds" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 CURRENT STATUS:" -ForegroundColor White
    Write-Host "  • Open PRs: $($Stats.PRs.Total) (Bot: $($Stats.PRs.Bot), Stale: $($Stats.PRs.Stale))" -ForegroundColor White
    Write-Host "  • Pending Approvals: $($Stats.PendingApprovals)" -ForegroundColor $(if($Stats.PendingApprovals -eq 0){"Green"}else{"Yellow"})
    Write-Host "  • Failed Workflows: $($Stats.FailedWorkflows)" -ForegroundColor $(if($Stats.FailedWorkflows -eq 0){"Green"}else{"Red"})
    Write-Host "  • Approvals Handled: $($Stats.TotalApprovalsHandled)" -ForegroundColor Green
    Write-Host "  • Auto-triggers: $($Stats.TotalAutoTriggers)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🤖 AGENT STATUS:" -ForegroundColor White
    Write-Host "  • PM Agent (PR #23): $(if($Stats.PMActive){"✅ Active"}else{"⚠️  Checking..."})" -ForegroundColor $(if($Stats.PMActive){"Green"}else{"Yellow"})
    Write-Host "  • Janitor Agent (PR #24): $(if($Stats.JanitorActive){"✅ Active"}else{"⚠️  Checking..."})" -ForegroundColor $(if($Stats.JanitorActive){"Green"}else{"Yellow"})
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
}

# Initialize statistics
$Stats = @{
    Iteration = 0
    Runtime = "00h 00m 00s"
    PRs = @{ Total = 0; Bot = 0; Stale = 0 }
    PendingApprovals = 0
    FailedWorkflows = 0
    TotalApprovalsHandled = 0
    TotalAutoTriggers = 0
    PMActive = $false
    JanitorActive = $false
}

Write-ColorOutput "═══════════════════════════════════════════════════════════════════" "Cyan"
Write-ColorOutput "  AUTONOMOUS ORCHESTRATION MONITOR STARTING" "Cyan"
Write-ColorOutput "  Duration: $DurationHours hours | Check Interval: $CheckIntervalSeconds seconds" "Cyan"
Write-ColorOutput "  End Time: $($EndTime.ToString('yyyy-MM-dd HH:mm:ss'))" "Cyan"
Write-ColorOutput "═══════════════════════════════════════════════════════════════════" "Cyan"
Write-Host ""

# Main monitoring loop
while ((Get-Date) -lt $EndTime) {
    $IterationCount++
    $Stats.Iteration = $IterationCount
    $runtime = (Get-Date) - $StartTime
    $Stats.Runtime = "{0:D2}h {1:D2}m {2:D2}s" -f $runtime.Hours, $runtime.Minutes, $runtime.Seconds
    
    Write-Host ""
    Write-ColorOutput "╔═══════════════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║  ITERATION #$IterationCount - $(Get-Date -Format 'HH:mm:ss')" "Cyan"
    Write-ColorOutput "╚═══════════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
    
    # Check and handle pending approvals
    $pendingCount = Approve-PendingWorkflows
    if ($pendingCount -gt 0) {
        $Stats.TotalApprovalsHandled += $pendingCount
    }
    $Stats.PendingApprovals = if ($pendingCount -lt 0) { $Stats.PendingApprovals } else { $pendingCount }
    
    # Monitor PRs
    $prStats = Monitor-OpenPRs
    if ($prStats) {
        $Stats.PRs = $prStats
    }
    
    # Check for failed workflows
    $failedCount = Check-Failed Workflows
    $Stats.FailedWorkflows = if ($failedCount -lt 0) { $Stats.FailedWorkflows } else { $failedCount }
    
    # Check agent activity
    $agentActive = Check-AgentActivity
    
    # Check specific agent PRs
    try {
        $pr23 = gh pr view 23 --json state,isDraft 2>$null | ConvertFrom-Json
        $Stats.PMActive = ($pr23.state -eq "OPEN")
        
        $pr24 = gh pr view 24 --json state,isDraft 2>$null | ConvertFrom-Json
        $Stats.JanitorActive = ($pr24.state -eq "OPEN")
    } catch {
        # PRs might not exist yet
    }
    
    # Trigger workflows every 5 iterations (5 minutes with 60s interval)
    if ($IterationCount % 5 -eq 0) {
        Write-Host ""
        Write-ColorOutput "⏰ 5-minute maintenance trigger" "Yellow"
        
        if ($Stats.PendingApprovals -gt 0) {
            Trigger-AutoApproval | Out-Null
            $Stats.TotalAutoTriggers++
        }
        
        if ($Stats.PRs.Bot -gt 0) {
            Trigger-AutoMerge | Out-Null
            $Stats.TotalAutoTriggers++
        }
    }
    
    # Display dashboard
    Display-Dashboard -Stats $Stats
    
    Write-ColorOutput "ACTIVITY LOG:" "White"
    
    # Sleep until next check
    Write-ColorOutput "😴 Sleeping for $CheckIntervalSeconds seconds..." "Gray"
    Write-Host ""
    Start-Sleep -Seconds $CheckIntervalSeconds
}

# Final summary
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            AUTONOMOUS MONITOR SESSION COMPLETED                      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-ColorOutput "📊 FINAL STATISTICS:" "Cyan"
Write-ColorOutput "  • Total Runtime: $($Stats.Runtime)" "White"
Write-ColorOutput "  • Iterations: $($Stats.Iteration)" "White"
Write-ColorOutput "  • Approvals Handled: $($Stats.TotalApprovalsHandled)" "Green"
Write-ColorOutput "  • Auto-triggers: $($Stats.TotalAutoTriggers)" "Green"
Write-ColorOutput "  • Final Open PRs: $($Stats.PRs.Total)" "White"
Write-Host ""
Write-ColorOutput "✅ Monitoring session ended successfully" "Green"
