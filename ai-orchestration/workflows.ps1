#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Workflow presets for common Mimir development tasks
    
.DESCRIPTION
    Collection of automated workflow functions for:
    - Development environment setup
    - Project workflows
    - Maintenance routines
    - Testing and validation
    
.NOTES
    Created: November 13, 2025
    Cost-free, single-user optimization
#>

$ErrorActionPreference = "Stop"
$MimirRoot = "C:\Users\Colter\Desktop\Projects\AI_Orchestration"

# Import unified CLI
. "$MimirRoot\m.ps1" -Command "help" | Out-Null

function Write-WorkflowStep {
    param([string]$msg, [string]$emoji = "▶")
    Write-Host "`n$emoji $msg" -ForegroundColor Cyan
}

<#
.SYNOPSIS
    Start complete development environment
.EXAMPLE
    Start-DevEnvironment -ProjectPath "C:\Projects\Github\7Days"
#>
function Start-DevEnvironment {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ProjectPath,
        
        [switch]$SkipIndex,
        [switch]$OpenBrowser
    )
    
    Write-WorkflowStep "Starting Mimir Development Environment" "🚀"
    
    # Step 1: Start containers
    Write-WorkflowStep "Starting Docker containers..."
    & "$MimirRoot\m.ps1" start
    
    # Step 2: Wait for services
    Write-WorkflowStep "Waiting for services to be ready..."
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:9042/health" -TimeoutSec 2 -ErrorAction Stop
            Write-Host "✓ Mimir MCP is ready" -ForegroundColor Green
            break
        } catch {
            $attempt++
            Write-Host "  Waiting... ($attempt/$maxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    
    # Step 3: Index project
    if (-not $SkipIndex -and (Test-Path $ProjectPath)) {
        Write-WorkflowStep "Indexing project: $ProjectPath"
        & "$MimirRoot\m.ps1" index $ProjectPath
    }
    
    # Step 4: Show stats
    Write-WorkflowStep "Fetching memory statistics..."
    & "$MimirRoot\m.ps1" stats
    
    # Step 5: Open tools
    if ($OpenBrowser) {
        Write-WorkflowStep "Opening browser tools..."
        Start-Process "http://localhost:7474"  # Neo4j
        Start-Sleep -Seconds 1
    }
    
    # Step 6: Open VS Code
    Write-WorkflowStep "Opening VS Code..."
    code $ProjectPath
    
    Write-Host "`n✓ Development environment ready!" -ForegroundColor Green
    Write-Host "  Project: $ProjectPath" -ForegroundColor Cyan
    Write-Host "  Neo4j: http://localhost:7474" -ForegroundColor Cyan
    Write-Host "  MCP: http://localhost:9042/health" -ForegroundColor Cyan
}

<#
.SYNOPSIS
    Daily maintenance routine
.EXAMPLE
    Invoke-DailyMaintenance -Verbose
#>
function Invoke-DailyMaintenance {
    param(
        [switch]$DryRun,
        [switch]$Verbose
    )
    
    Write-WorkflowStep "Running Daily Maintenance Routine" "🔧"
    
    # Step 1: Check container health
    Write-WorkflowStep "Checking container health..."
    & "$MimirRoot\m.ps1" health
    
    # Step 2: Run memory decay
    Write-WorkflowStep "Running memory decay calculation..."
    $memoryMaintenanceParams = @()
    if ($DryRun) { $memoryMaintenanceParams += "--dry-run" }
    if ($Verbose) { $memoryMaintenanceParams += "--verbose" }
    
    & "$MimirRoot\m.ps1" memory @memoryMaintenanceParams
    
    # Step 3: Check for stale memories
    Write-WorkflowStep "Checking for stale memories..."
    & "$MimirRoot\m.ps1" memory --find-stale --days 180
    
    # Step 4: Show statistics
    Write-WorkflowStep "Memory statistics..."
    & "$MimirRoot\m.ps1" stats
    
    Write-Host "`n✓ Daily maintenance complete!" -ForegroundColor Green
}

<#
.SYNOPSIS
    Quick project analysis workflow
.EXAMPLE
    Invoke-ProjectAnalysis -ProjectPath "C:\Projects\Github\7Days" -Query "authentication patterns"
#>
function Invoke-ProjectAnalysis {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ProjectPath,
        
        [string]$Query = "",
        [switch]$ReIndex
    )
    
    Write-WorkflowStep "Analyzing Project: $ProjectPath" "🔍"
    
    # Step 1: Ensure indexed
    if ($ReIndex -or -not (& "$MimirRoot\m.ps1" index-list | Select-String $ProjectPath)) {
        Write-WorkflowStep "Indexing project..."
        & "$MimirRoot\m.ps1" index $ProjectPath
    }
    
    # Step 2: Run query if provided
    if ($Query) {
        Write-WorkflowStep "Searching: $Query"
        & "$MimirRoot\m.ps1" query $Query
    }
    
    # Step 3: Show indexed folders
    Write-WorkflowStep "Currently indexed folders:"
    & "$MimirRoot\m.ps1" index-list
    
    Write-Host "`n✓ Analysis complete!" -ForegroundColor Green
}

<#
.SYNOPSIS
    Backup workflow
.EXAMPLE
    Invoke-MimirBackup -BackupPath "C:\Backups\Mimir"
#>
function Invoke-MimirBackup {
    param(
        [string]$BackupPath = "C:\Users\Colter\Desktop\Projects\AI_Orchestration\backups\$(Get-Date -Format 'yyyy-MM-dd_HH-mm')"
    )
    
    Write-WorkflowStep "Creating Mimir Backup" "💾"
    
    # Create backup directory
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    
    # Backup Neo4j data
    Write-WorkflowStep "Backing up Neo4j data..."
    $neo4jBackup = Join-Path $BackupPath "neo4j"
    Copy-Item -Path "$MimirRoot\data\neo4j" -Destination $neo4jBackup -Recurse -Force
    
    # Backup memories using export
    Write-WorkflowStep "Exporting memories..."
    $memoriesBackup = Join-Path $BackupPath "memories.json"
    
    # Query all memories via MCP and save
    try {
        $body = @{
            jsonrpc = "2.0"
            id = 1
            method = "tools/call"
            params = @{
                name = "mcp_mimir_memory_node"
                arguments = @{
                    operation = "query"
                    type = "memory"
                }
            }
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "http://localhost:9042/mcp" -Method Post -Body $body -ContentType "application/json"
        $response | ConvertTo-Json -Depth 10 | Out-File $memoriesBackup -Encoding UTF8
        
        Write-Host "✓ Saved $($response.result.nodes.Count) memories" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to export memories: $_" -ForegroundColor Red
    }
    
    # Backup configuration
    Write-WorkflowStep "Backing up configuration..."
    Copy-Item -Path "$MimirRoot\.env" -Destination $BackupPath -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$MimirRoot\docker-compose.yml" -Destination $BackupPath -Force
    
    $backupSize = (Get-ChildItem $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Host "`n✓ Backup complete!" -ForegroundColor Green
    Write-Host "  Location: $BackupPath" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Cyan
}

<#
.SYNOPSIS
    Performance test workflow
.EXAMPLE
    Test-MimirPerformance
#>
function Test-MimirPerformance {
    Write-WorkflowStep "Testing Mimir Performance" "⚡"
    
    # Test 1: Vector search performance
    Write-WorkflowStep "Test 1: Vector Search (5 queries)"
    $queries = @(
        "workflow automation patterns"
        "docker container management"
        "memory optimization techniques"
        "security scanning tools"
        "browser automation"
    )
    
    $times = @()
    foreach ($q in $queries) {
        $start = Get-Date
        & "$MimirRoot\m.ps1" query $q | Out-Null
        $end = Get-Date
        $ms = ($end - $start).TotalMilliseconds
        $times += $ms
        Write-Host "  '$q': $([math]::Round($ms, 0))ms" -ForegroundColor Yellow
    }
    
    $avgTime = ($times | Measure-Object -Average).Average
    Write-Host "  Average: $([math]::Round($avgTime, 0))ms" -ForegroundColor Green
    
    # Test 2: Index operations
    Write-WorkflowStep "Test 2: Memory Operations"
    
    $start = Get-Date
    & "$MimirRoot\m.ps1" stats | Out-Null
    $statsTime = ($( Get-Date) - $start).TotalMilliseconds
    Write-Host "  Stats query: $([math]::Round($statsTime, 0))ms" -ForegroundColor Yellow
    
    Write-Host "`n✓ Performance tests complete!" -ForegroundColor Green
}

<#
.SYNOPSIS
    Health check workflow
.EXAMPLE
    Test-MimirHealth -AutoRestart
#>
function Test-MimirHealth {
    param([switch]$AutoRestart)
    
    Write-WorkflowStep "Running Health Checks" "🏥"
    
    & "$MimirRoot\m.ps1" health
    
    # Check if any unhealthy
    $unhealthy = docker ps --filter "health=unhealthy" --format "{{.Names}}"
    
    if ($unhealthy -and $AutoRestart) {
        Write-WorkflowStep "Found unhealthy containers, restarting..." "⚠"
        docker restart $unhealthy
        Start-Sleep -Seconds 10
        & "$MimirRoot\m.ps1" health
    }
    
    Write-Host "`n✓ Health check complete!" -ForegroundColor Green
}

# Export functions
Export-ModuleMember -Function Start-DevEnvironment, Invoke-DailyMaintenance, Invoke-ProjectAnalysis, Invoke-MimirBackup, Test-MimirPerformance, Test-MimirHealth

# Show usage if run directly
if ($MyInvocation.InvocationName -ne '.') {
    Write-Host "`nMimir Workflow Presets`n" -ForegroundColor Cyan
    Write-Host "Available Functions:" -ForegroundColor Yellow
    Write-Host "  Start-DevEnvironment -ProjectPath <path>    Setup dev environment"
    Write-Host "  Invoke-DailyMaintenance [-DryRun]           Run maintenance"
    Write-Host "  Invoke-ProjectAnalysis -ProjectPath <path>  Analyze project"
    Write-Host "  Invoke-MimirBackup [-BackupPath <path>]    Create backup"
    Write-Host "  Test-MimirPerformance                       Run performance tests"
    Write-Host "  Test-MimirHealth [-AutoRestart]            Health checks"
    Write-Host "`nUsage:" -ForegroundColor Yellow
    Write-Host "  Import-Module .\workflows.ps1"
    Write-Host "  Start-DevEnvironment -ProjectPath 'C:\Projects\Github\7Days'"
    Write-Host ""
}
