#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Diagnoses why PRs are idle and automatically fixes them
.DESCRIPTION
    For each open PR:
    1. Check test status
    2. If failing, analyze logs
    3. Trigger fixes via GitHub Copilot agents
    4. If tests pass, merge automatically
#>

param(
    [switch]$DryRun = $false,
    [int]$MaxPRs = 23
)

$ErrorActionPreference = "Continue"

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Get-PRDetails {
    param([int]$PRNumber)
    
    Write-Status "📋 Analyzing PR #$PRNumber..." "Cyan"
    
    try {
        $prData = gh pr view $PRNumber --json number,title,author,state,statusCheckRollup,mergeable,headRefName,updatedAt,url | ConvertFrom-Json
        
        $checks = @{
            Total = 0
            Passed = 0
            Failed = 0
            Pending = 0
            ActionRequired = 0
        }
        
        if ($prData.statusCheckRollup) {
            $checks.Total = $prData.statusCheckRollup.Count
            $checks.Passed = ($prData.statusCheckRollup | Where-Object { $_.conclusion -eq 'SUCCESS' }).Count
            $checks.Failed = ($prData.statusCheckRollup | Where-Object { $_.conclusion -eq 'FAILURE' }).Count
            $checks.Pending = ($prData.statusCheckRollup | Where-Object { $_.status -in @('IN_PROGRESS', 'QUEUED', 'PENDING') }).Count
            $checks.ActionRequired = ($prData.statusCheckRollup | Where-Object { $_.conclusion -eq 'ACTION_REQUIRED' }).Count
        }
        
        return @{
            Number = $prData.number
            Title = $prData.title
            Author = $prData.author.login
            State = $prData.state
            Branch = $prData.headRefName
            Mergeable = $prData.mergeable
            UpdatedAt = $prData.updatedAt
            URL = $prData.url
            Checks = $checks
            FailingChecks = $prData.statusCheckRollup | Where-Object { $_.conclusion -eq 'FAILURE' }
        }
    } catch {
        Write-Status "  ❌ Failed to analyze PR #$PRNumber : $($_.Exception.Message)" "Red"
        return $null
    }
}

function Get-FailureDetails {
    param([string]$Branch, [string]$CheckName)
    
    Write-Status "  🔍 Fetching failure logs for '$CheckName'..." "Yellow"
    
    try {
        # Get the most recent run for this branch
        $runData = gh run list --branch $Branch --limit 5 --json databaseId,conclusion,name | ConvertFrom-Json
        $failedRun = $runData | Where-Object { $_.conclusion -eq 'failure' -and $_.name -like "*$CheckName*" } | Select-Object -First 1
        
        if ($failedRun) {
            Write-Status "    Found failed run: $($failedRun.databaseId)" "Gray"
            
            # Try to get failure logs (this may fail if run is too old)
            $logs = gh run view $failedRun.databaseId --log-failed 2>&1 | Out-String
            
            # Extract key error patterns
            $errors = $logs | Select-String -Pattern "(FAIL|Error|npm ERR!|ERROR|Exception|AssertionError)" -AllMatches | 
                      Select-Object -First 10 | ForEach-Object { $_.Line.Trim() }
            
            return @{
                RunId = $failedRun.databaseId
                Errors = $errors
                FullLog = $logs
            }
        }
    } catch {
        Write-Status "    ⚠️  Could not fetch logs: $($_.Exception.Message)" "Yellow"
    }
    
    return $null
}

function Fix-PR {
    param(
        [hashtable]$PRInfo,
        [string]$IssueDescription
    )
    
    Write-Status "  🔧 Creating fix task for PR #$($PRInfo.Number)..." "Cyan"
    
    if ($DryRun) {
        Write-Status "    [DRY RUN] Would create fix task" "Yellow"
        return $false
    }
    
    $fixTask = @"
AUTO-FIX TASK for PR #$($PRInfo.Number)

**PR Details:**
- Title: $($PRInfo.Title)
- Branch: $($PRInfo.Branch)
- URL: $($PRInfo.URL)

**Problem:**
$IssueDescription

**Required Actions:**
1. Checkout branch: $($PRInfo.Branch)
2. Analyze the failing tests
3. Fix the root cause
4. Run tests locally to verify
5. Commit and push fixes
6. Verify CI passes

**Success Criteria:**
- All tests passing
- No new issues introduced
- PR ready to merge
"@
    
    try {
        # Use devops agent for workflow/test failures
        $result = $fixTask | gh agent-task create --custom-agent devops --follow -F - 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "    ✅ Fix task created successfully" "Green"
            return $true
        } else {
            Write-Status "    ❌ Failed to create fix task: $result" "Red"
            return $false
        }
    } catch {
        Write-Status "    ❌ Error creating fix task: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Merge-PRIfReady {
    param([hashtable]$PRInfo)
    
    if ($PRInfo.Checks.Failed -eq 0 -and $PRInfo.Checks.Pending -eq 0 -and $PRInfo.Checks.ActionRequired -eq 0) {
        Write-Status "  ✅ All checks passed! Checking if mergeable..." "Green"
        
        if ($PRInfo.Mergeable -eq 'MERGEABLE') {
            if ($DryRun) {
                Write-Status "    [DRY RUN] Would merge PR #$($PRInfo.Number)" "Yellow"
                return $false
            }
            
            try {
                gh pr merge $PRInfo.Number --auto --squash --delete-branch
                Write-Status "    ✅ PR #$($PRInfo.Number) queued for auto-merge" "Green"
                return $true
            } catch {
                Write-Status "    ❌ Failed to merge: $($_.Exception.Message)" "Red"
                return $false
            }
        } else {
            Write-Status "    ⚠️  PR not mergeable (conflicts or other issues)" "Yellow"
            return $false
        }
    }
    
    return $false
}

# Main execution
Write-Status "🚀 STARTING PR DIAGNOSIS AND AUTO-FIX" "Cyan"
Write-Status "════════════════════════════════════════════════════════════" "Cyan"

if ($DryRun) {
    Write-Status "⚠️  DRY RUN MODE - No actual changes will be made" "Yellow"
}

# Get all open PRs
Write-Status "`n📋 Fetching open PRs..." "Cyan"
$openPRs = gh pr list --json number --limit $MaxPRs | ConvertFrom-Json

Write-Status "Found $($openPRs.Count) open PRs`n" "White"

$stats = @{
    Total = 0
    ReadyToMerge = 0
    NeedingFixes = 0
    InProgress = 0
    Blocked = 0
    FixTasksCreated = 0
    Merged = 0
}

foreach ($pr in $openPRs) {
    $stats.Total++
    
    $prInfo = Get-PRDetails -PRNumber $pr.number
    
    if (-not $prInfo) {
        $stats.Blocked++
        continue
    }
    
    Write-Status "`nPR #$($prInfo.Number): $($prInfo.Title)" "Yellow"
    Write-Status "  Author: $($prInfo.Author)" "Gray"
    Write-Status "  Branch: $($prInfo.Branch)" "Gray"
    Write-Status "  Last Updated: $($prInfo.UpdatedAt)" "Gray"
    Write-Status "  Checks: $($prInfo.Checks.Passed) passed, $($prInfo.Checks.Failed) failed, $($prInfo.Checks.Pending) pending, $($prInfo.Checks.ActionRequired) action_required" "White"
    
    # Categorize PR status
    if ($prInfo.Checks.ActionRequired -gt 0) {
        Write-Status "  ⏸️  BLOCKED - Needs manual approval in GitHub UI" "Red"
        $stats.Blocked++
        continue
    }
    
    if ($prInfo.Checks.Pending -gt 0) {
        Write-Status "  ⏳ IN PROGRESS - Tests running..." "Yellow"
        $stats.InProgress++
        continue
    }
    
    if ($prInfo.Checks.Failed -gt 0) {
        Write-Status "  ❌ NEEDS FIX - $($prInfo.Checks.Failed) failing checks" "Red"
        $stats.NeedingFixes++
        
        # Analyze failures
        foreach ($failedCheck in $prInfo.FailingChecks) {
            Write-Status "    Failed: $($failedCheck.name)" "Red"
            
            $failureDetails = Get-FailureDetails -Branch $prInfo.Branch -CheckName $failedCheck.name
            
            if ($failureDetails -and $failureDetails.Errors) {
                Write-Status "      Sample errors:" "Yellow"
                $failureDetails.Errors | Select-Object -First 3 | ForEach-Object {
                    Write-Status "        $_" "Gray"
                }
            }
        }
        
        # Create fix task
        $issueDesc = "PR has $($prInfo.Checks.Failed) failing checks. See $($prInfo.URL)"
        if (Fix-PR -PRInfo $prInfo -IssueDescription $issueDesc) {
            $stats.FixTasksCreated++
        }
        
    } elseif ($prInfo.Checks.Total -eq 0) {
        Write-Status "  ⏳ WAITING - No checks have run yet" "Yellow"
        $stats.InProgress++
        
    } else {
        Write-Status "  ✅ READY TO MERGE - All checks passed" "Green"
        $stats.ReadyToMerge++
        
        if (Merge-PRIfReady -PRInfo $prInfo) {
            $stats.Merged++
        }
    }
    
    Write-Host "" # Blank line between PRs
    Start-Sleep -Milliseconds 500 # Rate limiting
}

# Summary
Write-Status "`n════════════════════════════════════════════════════════════" "Cyan"
Write-Status "📊 SUMMARY" "Cyan"
Write-Status "════════════════════════════════════════════════════════════" "Cyan"
Write-Status "Total PRs analyzed: $($stats.Total)" "White"
Write-Status "  ✅ Ready to merge: $($stats.ReadyToMerge)" "Green"
Write-Status "  ⏳ In progress: $($stats.InProgress)" "Yellow"
Write-Status "  ❌ Needing fixes: $($stats.NeedingFixes)" "Red"
Write-Status "  ⏸️  Blocked (action_required): $($stats.Blocked)" "Red"
Write-Status "  🔧 Fix tasks created: $($stats.FixTasksCreated)" "Cyan"
Write-Status "  🎉 Merged: $($stats.Merged)" "Green"
Write-Status "`n✅ Diagnosis complete!" "Green"
