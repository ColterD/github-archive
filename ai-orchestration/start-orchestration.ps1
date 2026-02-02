# start-orchestration.ps1 - Quick Start for AI_Orchestration
# Validates setup and starts the orchestration system

$ErrorActionPreference = "Stop"

Write-Host "=== AI_Orchestration Startup ===" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "  ✓ Docker: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Docker not found. Install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check GitHub CLI
try {
    $ghVersion = gh --version | Select-Object -First 1
    Write-Host "  ✓ GitHub CLI: $ghVersion" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ GitHub CLI not found. Install: winget install GitHub.cli" -ForegroundColor Red
    exit 1
}

# Check PowerShell version
$psVersion = $PSVersionTable.PSVersion
if ($psVersion.Major -lt 7) {
    Write-Host "  ⚠ PowerShell $psVersion detected. Recommend 7+ for best experience." -ForegroundColor Yellow
}
else {
    Write-Host "  ✓ PowerShell: $psVersion" -ForegroundColor Green
}

# Check if in git repository
Write-Host ""
Write-Host "[2/6] Verifying repository setup..." -ForegroundColor Yellow
try {
    $repoUrl = git remote get-url origin 2>$null
    Write-Host "  ✓ Git repository: $repoUrl" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Not in a git repository or no remote configured." -ForegroundColor Red
    exit 1
}

# Check Mimir status
Write-Host ""
Write-Host "[3/6] Checking Mimir services..." -ForegroundColor Yellow
$mimirRunning = docker ps | Select-String "mimir_mcp_server"
$neo4jRunning = docker ps | Select-String "mimir_neo4j"

if (!$mimirRunning -or !$neo4jRunning) {
    Write-Host "  ⚠ Mimir services not running. Starting..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 10
}

# Test Mimir API
try {
    $health = Invoke-RestMethod -Uri "http://localhost:9042/health" -TimeoutSec 5
    Write-Host "  ✓ Mimir API: $($health.status)" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Mimir API not responding at http://localhost:9042" -ForegroundColor Red
    Write-Host "    Try: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Check GitHub Copilot CLI
Write-Host ""
Write-Host "[4/6] Verifying GitHub Copilot CLI..." -ForegroundColor Yellow
try {
    # Test if gh copilot command exists
    $copilotTest = gh copilot --help 2>&1
    if ($copilotTest -like "*unknown command*") {
        Write-Host "  ✗ GitHub Copilot CLI extension not installed." -ForegroundColor Red
        Write-Host "    Install: gh extension install github/gh-copilot" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  ✓ GitHub Copilot CLI ready" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠ Could not verify Copilot CLI status" -ForegroundColor Yellow
}

# Check custom agents
Write-Host ""
Write-Host "[5/6] Verifying custom agents..." -ForegroundColor Yellow
$agentFiles = Get-ChildItem -Path ".github\agents\*.agent.md" -ErrorAction SilentlyContinue
if ($agentFiles) {
    Write-Host "  ✓ Found $($agentFiles.Count) agent definition(s):" -ForegroundColor Green
    foreach ($agent in $agentFiles) {
        Write-Host "    - $($agent.BaseName)" -ForegroundColor Gray
    }
}
else {
    Write-Host "  ✗ No agent definitions found in .github/agents/" -ForegroundColor Red
    exit 1
}

# Create logs directory
Write-Host ""
Write-Host "[6/6] Preparing environment..." -ForegroundColor Yellow
$logsDir = "logs\orchestration"
if (!(Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    Write-Host "  ✓ Created logs directory" -ForegroundColor Green
}
else {
    Write-Host "  ✓ Logs directory exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ AI_Orchestration is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start orchestration:  .\orchestrate.ps1 -Mode auto" -ForegroundColor White
Write-Host "  2. Test manually:        gh copilot" -ForegroundColor White
Write-Host "  3. View documentation:   cat ORCHESTRATION_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "Quick test:" -ForegroundColor Cyan
Write-Host "  gh copilot" -ForegroundColor White
Write-Host "  Then type: /agent pm" -ForegroundColor White
Write-Host ""

# Offer to start orchestration
$response = Read-Host "Start orchestration now? (y/N)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Starting orchestration in automatic mode..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    Start-Sleep -Seconds 2
    .\orchestrate.ps1 -Mode auto
}
else {
    Write-Host ""
    Write-Host "Ready to start manually. Use: .\orchestrate.ps1 -Mode auto" -ForegroundColor Yellow
    Write-Host ""
}
