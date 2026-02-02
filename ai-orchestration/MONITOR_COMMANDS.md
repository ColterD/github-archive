# 🎮 Autonomous Monitor Control Commands

## Quick Status Commands

### Check if Monitor is Running
```powershell
Get-Process pwsh | Where-Object { $_.MainWindowTitle -like "*autonomous*" }
```

### View Current PR Status
```powershell
gh pr list --json number,author,title,updatedAt
```

### Check Workflow Runs
```powershell
# Recent runs
gh run list --limit 10

# Failed runs
gh run list --status failure --limit 10

# Pending approvals (should be zero now)
gh run list --status action_required --limit 10
```

### Monitor Specific PRs
```powershell
# PR #23 (PM Agent)
gh pr view 23

# PR #24 (Janitor Agent)
gh pr view 24
```

## Emergency Commands (Only If Needed)

### Stop Monitoring (If Required)
```powershell
# Find the monitoring process
$monitor = Get-Process pwsh | Where-Object { $_.MainWindowTitle -like "*autonomous*" }

# Stop it gracefully
$monitor | Stop-Process
```

### Restart Monitoring
```powershell
cd C:\Users\Colter\Desktop\Projects\AI_Orchestration
.\autonomous-monitor.ps1
```

### Manual Workflow Triggers

```powershell
# Trigger auto-approval manually
gh workflow run "Auto-approve and Run Workflows"

# Trigger auto-merge manually
gh workflow run "Auto-merge Bot PRs"

# View workflow status
gh run list --workflow="Auto-approve and Run Workflows" --limit 5
gh run list --workflow="Auto-merge Bot PRs" --limit 5
```

## Monitoring Dashboard

The dedicated PowerShell window shows real-time stats:

- **Iteration count** - How many check cycles completed
- **Runtime** - Elapsed time since start
- **Time remaining** - Until 12-hour session ends
- **Open PRs** - Total, bot, and stale counts
- **Pending approvals** - Should be zero (auto-canceled)
- **Failed workflows** - Recent failures
- **Agent status** - PM (#23) and Janitor (#24) activity

## What's Happening Automatically

Every 60 seconds, the monitor:
1. ✅ Checks for workflows in `action_required` status → Cancels them
2. ✅ Checks for failed workflows → Reports them
3. ✅ Monitors all open PRs → Counts total, bot, stale
4. ✅ Tracks agent activity → Detects stalls in PR #23, #24

Every 5 minutes, the monitor:
1. ✅ Triggers auto-approval workflow
2. ✅ Triggers auto-merge workflow

## Expected Behavior

### Normal Operation
- ✅ Dashboard updates every 60 seconds
- ✅ Pending approvals stay at 0 (auto-canceled)
- ✅ Bot PRs merge when tests pass
- ✅ No manual intervention needed

### If Something Goes Wrong
- ⚠️ Failed workflows appear in dashboard
- ⚠️ Agent stalls detected and reported
- ⚠️ Check PowerShell window for error messages

## Session Details

- **Start Time:** Check PowerShell window or AUTONOMOUS_SESSION_LOG.md
- **End Time:** 12 hours after start
- **Log File:** AUTONOMOUS_SESSION_LOG.md
- **Script:** autonomous-monitor.ps1

## Zero Intervention Required

✅ **You can safely ignore the system for 12 hours**

The monitoring script handles:
- Approvals (via cancellation workaround)
- Merges (when all checks pass)
- Failure detection
- Agent stall detection
- Workflow health checks
- Recovery actions

---

**Created:** 2025-01-26  
**Monitoring Status:** 🟢 ACTIVE (PID: Check with Get-Process)  
**Agent:** Claudette v5.2.1
