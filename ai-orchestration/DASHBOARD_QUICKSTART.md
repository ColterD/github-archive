# 🎯 Dashboard Quick Start

## Start Dashboard
```powershell
cd C:\Users\Colter\Desktop\Projects\AI_Orchestration
.\start-dashboard.ps1
```
**Opens at:** http://localhost:5173

---

## What You'll See

### 📊 Code Metrics (Top)
- Total PRs, Lines Added/Removed, Files Changed
- Bar chart: Additions vs Deletions by agent
- Pie chart: PR distribution
- Performance table

### 🤖 Agent Monitor (Left)
- Live PR feed (updates every 15s)
- Active agents list
- Quick metrics cards

### 📈 Task Timeline (Right)
- Visual timeline of agent actions
- Recent activities with code impact
- Updates every 20s

---

## Test with Live Agent
```powershell
.\test-dashboard-live.ps1
```

Or manually:
```powershell
gh agent-task create --custom-agent pm -F - <<< "Create a test file"
```

Watch dashboard update within 15 seconds!

---

## Features
- ✅ Real GitHub API integration
- ✅ Auto-refresh (10-30s intervals)
- ✅ Live PR monitoring
- ✅ Code metrics visualization
- ✅ Agent activity tracking
- ✅ Rate limit monitoring

---

## Files
| Component | Purpose | Refresh |
|-----------|---------|---------|
| `AgentMonitor.tsx` | PR tracking | 15s |
| `TaskTimeline.tsx` | Activity feed | 20s |
| `CodeMetricsDashboard.tsx` | Charts | 30s |
| `githubApi.ts` | API service | - |

---

## Current Data
- **6 PRs** from Copilot Agent
- **2,289 lines** added
- **9 files** changed
- **All in 13 minutes** ⚡

---

**The dashboard is ready!** 🚀
