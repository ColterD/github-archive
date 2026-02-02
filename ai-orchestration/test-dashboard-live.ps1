#!/usr/bin/env pwsh
# Test Dashboard with Live GitHub Coding Agent

Write-Host "🧪 Dashboard + Live Agent Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if dashboard is running
Write-Host "Step 1: Checking dashboard..." -ForegroundColor Yellow
$dashboardRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $dashboardRunning = $true
    Write-Host "✅ Dashboard is running at http://localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "❌ Dashboard is NOT running" -ForegroundColor Red
    Write-Host "   Start it with: .\start-dashboard.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Show current PR count
Write-Host "Step 2: Getting baseline PR count..." -ForegroundColor Yellow
$currentPRs = gh pr list --state all --json number | ConvertFrom-Json
$prCount = $currentPRs.Count
Write-Host "   Current PRs: $prCount" -ForegroundColor White
Write-Host ""

# Step 3: Open dashboard in browser
Write-Host "Step 3: Opening dashboard in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"
Write-Host "✅ Dashboard opened" -ForegroundColor Green
Write-Host ""

# Step 4: Ask user confirmation
Write-Host "👀 WATCH THE DASHBOARD NOW!" -ForegroundColor Magenta
Write-Host ""
Write-Host "You should see:" -ForegroundColor Cyan
Write-Host "  - $prCount total PRs" -ForegroundColor White
Write-Host "  - Code metrics charts" -ForegroundColor White
Write-Host "  - Agent activity timeline" -ForegroundColor White
Write-Host "  - Live indicator (pulsing green dot)" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Ready to spawn a test agent? (y/n)"
if ($continue -ne 'y') {
    Write-Host "Test cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host ""

# Step 5: Spawn GitHub Coding Agent
Write-Host "Step 5: Spawning GitHub Coding Agent..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Task: 'Create a DASHBOARD_TEST.md file documenting the new dashboard features'" -ForegroundColor Cyan
Write-Host ""

$task = @"
Create a DASHBOARD_TEST.md file that documents:
1. What the new dashboard displays
2. Key features (real-time updates, metrics, timeline)
3. How to use it
4. Screenshots placeholders for future documentation

Keep it concise and well-formatted.
"@

Write-Host "🤖 Launching agent..." -ForegroundColor Green
gh agent-task create --custom-agent pm -F - <<< $task

Write-Host ""
Write-Host "✅ Agent spawned!" -ForegroundColor Green
Write-Host ""

# Step 6: Monitor for changes
Write-Host "Step 6: Monitoring dashboard for updates..." -ForegroundColor Yellow
Write-Host ""
Write-Host "👁️  Watch your dashboard for:" -ForegroundColor Magenta
Write-Host "   1. New PR appearing in 'Recent PRs' (within 15 seconds)" -ForegroundColor White
Write-Host "   2. Total PR count increasing" -ForegroundColor White
Write-Host "   3. New timeline entry added" -ForegroundColor White
Write-Host "   4. Code metrics updating" -ForegroundColor White
Write-Host ""

# Wait and check for new PR
Write-Host "⏳ Waiting 30 seconds for agent to create PR..." -ForegroundColor Yellow
for ($i = 30; $i -gt 0; $i--) {
    Write-Host "   $i seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
}

Write-Host ""

# Check if new PR was created
$newPRs = gh pr list --state all --json number,title,createdAt | ConvertFrom-Json
$recentPRs = $newPRs | Where-Object {
    $createdDate = [DateTime]::Parse($_.createdAt)
    $createdDate -gt (Get-Date).AddMinutes(-2)
}

if ($recentPRs.Count -gt 0) {
    Write-Host "✅ SUCCESS! New PR detected:" -ForegroundColor Green
    $recentPRs | ForEach-Object {
        Write-Host "   PR #$($_.number): $($_.title)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "🎉 Dashboard should now show this PR!" -ForegroundColor Magenta
} else {
    Write-Host "⏳ No PR detected yet (agent may still be working)" -ForegroundColor Yellow
    Write-Host "   Check dashboard in a few minutes" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📊 Final validation:" -ForegroundColor Cyan
Write-Host "   - Dashboard showing new PR? (Check UI)" -ForegroundColor White
Write-Host "   - Timeline updated? (Check timeline panel)" -ForegroundColor White
Write-Host "   - Metrics refreshed? (Check charts)" -ForegroundColor White
Write-Host ""
Write-Host "Test complete! 🎯" -ForegroundColor Green
