#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Unified CLI tool for Mimir AI Orchestration Stack
    
.DESCRIPTION
    Single command-line interface for all Mimir operations:
    - Container management (start, stop, restart, status, logs)
    - Project indexing (add, remove, list)
    - Memory operations (maintenance, query, search)
    - Health checks and diagnostics
    
.PARAMETER Command
    The command to execute
    
.PARAMETER Args
    Additional arguments for the command
    
.EXAMPLE
    .\m.ps1 start
    .\m.ps1 index C:\Projects\Github\7Days
    .\m.ps1 memory --dry-run
    .\m.ps1 query "workflow patterns"
    
.NOTES
    Created: November 13, 2025
    Single-user, cost-free optimization for development workflow
#>

param(
    [Parameter(Position=0, Mandatory=$false)]
    [string]$Command = "help",
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"
$MimirRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Color output functions
function Write-Success { param([string]$msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Info { param([string]$msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Warn { param([string]$msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Fail { param([string]$msg) Write-Host "✗ $msg" -ForegroundColor Red }

# Helper functions
function Test-DockerRunning {
    try {
        docker ps | Out-Null
        return $true
    } catch {
        Write-Fail "Docker is not running. Please start Docker Desktop."
        return $false
    }
}

function Get-MimirStatus {
    $containers = @(
        @{Name="mimir"; Port=9042; Service="MCP Server"}
        @{Name="neo4j"; Port=7474; Service="Neo4j Browser"}
        @{Name="ollama"; Port=11434; Service="Ollama API"}
    )
    
    foreach ($c in $containers) {
        $running = docker ps --filter "expose=$($c.Port)" --format "{{.Names}}" 2>$null
        if ($running) {
            Write-Success "$($c.Service) ($($c.Name)): Running on port $($c.Port)"
        } else {
            Write-Warn "$($c.Service) ($($c.Name)): Not running"
        }
    }
}

function Invoke-MimirQuery {
    param([string]$Query)
    
    try {
        $body = @{
            jsonrpc = "2.0"
            id = 1
            method = "tools/call"
            params = @{
                name = "mcp_mimir_vector_search_nodes"
                arguments = @{
                    query = $Query
                    limit = 5
                    min_similarity = 0.7
                }
            }
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "http://localhost:9042/mcp" -Method Post -Body $body -ContentType "application/json"
        
        if ($response.result) {
            Write-Success "Found $($response.result.results.Count) results:"
            foreach ($result in $response.result.results) {
                Write-Host "`n  [$($result.similarity.ToString('F4'))] $($result.title)" -ForegroundColor Cyan
                Write-Host "  $($result.content_preview.Substring(0, [Math]::Min(100, $result.content_preview.Length)))..."
            }
        } else {
            Write-Warn "No results found or error: $($response.error.message)"
        }
    } catch {
        Write-Fail "Failed to query Mimir: $_"
        Write-Info "Make sure Mimir is running: .\m.ps1 start"
    }
}

# Command implementations
$commands = @{
    "help" = {
        Write-Host "`nMimir CLI - Unified Interface`n" -ForegroundColor Cyan
        Write-Host "USAGE:" -ForegroundColor Yellow
        Write-Host "  .\m.ps1 <command> [args...]`n"
        
        Write-Host "CONTAINER MANAGEMENT:" -ForegroundColor Yellow
        Write-Host "  start              Start all Mimir containers"
        Write-Host "  stop               Stop all containers"
        Write-Host "  restart            Restart all containers"
        Write-Host "  status             Show container status"
        Write-Host "  logs [service]     Show logs (default: all services)"
        Write-Host "  health             Check health endpoints"
        
        Write-Host "`nPROJECT INDEXING:" -ForegroundColor Yellow
        Write-Host "  index <path>       Index a project folder"
        Write-Host "  index-list         List indexed folders"
        Write-Host "  index-remove <path> Remove folder from index"
        
        Write-Host "`nMEMORY OPERATIONS:" -ForegroundColor Yellow
        Write-Host "  memory [args]      Run memory maintenance (--dry-run, --verbose)"
        Write-Host "  query <text>       Vector search memories"
        Write-Host "  stats              Show memory statistics"
        
        Write-Host "`nDEVELOPMENT:" -ForegroundColor Yellow
        Write-Host "  dev                Start development environment with hot reload"
        Write-Host "  build              Rebuild Mimir TypeScript"
        Write-Host "  shell [service]    Open shell in container (default: mimir)"
        
        Write-Host "`nSECURITY & PROCESSING:" -ForegroundColor Yellow
        Write-Host "  security-scan [path] Run comprehensive security scan (SAST/SCA/Secrets)"
        Write-Host "  process-docs <path>  Extract knowledge from PDFs and store in Mimir"
        
        Write-Host "`nPROMPT MANAGEMENT:" -ForegroundColor Yellow
        Write-Host "  prompt-version [cmd] Manage prompt versions (status|create|activate|list|diff|rollback)"
        Write-Host "  prompt-eval <file>   Evaluate prompt quality against test scenarios"
        
        Write-Host "`nTESTING:" -ForegroundColor Yellow
        Write-Host "  test-browser [args]  Run Playwright browser tests (optional: test file or flags)"
        
        Write-Host "`nMONITORING:" -ForegroundColor Yellow
        Write-Host "  monitoring           Start Grafana + Prometheus and open dashboard"
        
        Write-Host "`nANALYSIS:" -ForegroundColor Yellow
        Write-Host "  map-projects <paths> Map dependencies across multiple projects"
        
        Write-Host "`nEXAMPLES:" -ForegroundColor Yellow
        Write-Host "  .\m.ps1 start"
        Write-Host "  .\m.ps1 index C:\Projects\Github\7Days"
        Write-Host "  .\m.ps1 memory --dry-run"
        Write-Host "  .\m.ps1 query `"workflow patterns`""
        Write-Host "  .\m.ps1 logs mimir"
        Write-Host ""
    }
    
    "start" = {
        if (-not (Test-DockerRunning)) { return }
        
        Write-Info "Starting Mimir containers..."
        Push-Location $MimirRoot
        docker-compose up -d
        Pop-Location
        
        Write-Info "Waiting for services to be ready..."
        Start-Sleep -Seconds 10
        
        Get-MimirStatus
        Write-Success "`nMimir is ready!"
        Write-Info "Neo4j Browser: http://localhost:7474 (user: neo4j, pass: password)"
        Write-Info "MCP Health: http://localhost:9042/health"
    }
    
    "stop" = {
        if (-not (Test-DockerRunning)) { return }
        
        Write-Info "Stopping Mimir containers..."
        Push-Location $MimirRoot
        docker-compose down
        Pop-Location
        Write-Success "Mimir stopped"
    }
    
    "restart" = {
        & $commands["stop"]
        Start-Sleep -Seconds 3
        & $commands["start"]
    }
    
    "status" = {
        if (-not (Test-DockerRunning)) { return }
        
        Write-Info "Container Status:"
        Get-MimirStatus
        
        Write-Host "`nDocker Containers:" -ForegroundColor Cyan
        docker ps --filter "label=com.docker.compose.project=ai_orchestration" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    }
    
    "logs" = {
        if (-not (Test-DockerRunning)) { return }
        
        $service = if ($Args.Count -gt 0) { $Args[0] } else { "" }
        
        Push-Location $MimirRoot
        if ($service) {
            Write-Info "Showing logs for $service (Ctrl+C to exit)..."
            docker-compose logs -f $service
        } else {
            Write-Info "Showing all logs (Ctrl+C to exit)..."
            docker-compose logs -f
        }
        Pop-Location
    }
    
    "health" = {
        Write-Info "Checking health endpoints...`n"
        
        # Mimir MCP
        try {
            $healthResponse = Invoke-WebRequest -Uri "http://localhost:9042/health" -TimeoutSec 5
            Write-Success "Mimir MCP: Healthy (HTTP $($healthResponse.StatusCode))"
        } catch {
            Write-Fail "Mimir MCP: Unhealthy or not responding"
        }
        
        # Neo4j
        try {
            $neo4jResponse = Invoke-WebRequest -Uri "http://localhost:7474" -TimeoutSec 5
            Write-Success "Neo4j: Healthy (HTTP $($neo4jResponse.StatusCode))"
        } catch {
            Write-Fail "Neo4j: Unhealthy or not responding"
        }
        
        # Ollama
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
            Write-Success "Ollama: Healthy (HTTP $($response.StatusCode))"
        } catch {
            Write-Fail "Ollama: Unhealthy or not responding"
        }
    }
    
    "index" = {
        if ($Args.Count -eq 0) {
            Write-Fail "Usage: .\m.ps1 index <path>"
            Write-Info "Example: .\m.ps1 index C:\Projects\Github\7Days"
            return
        }
        
        $path = $Args[0]
        if (-not (Test-Path $path)) {
            Write-Fail "Path does not exist: $path"
            return
        }
        
        Write-Info "Indexing project: $path"
        Push-Location "$MimirRoot\mimir"
        
        # Check if npm dependencies installed
        if (-not (Test-Path "node_modules")) {
            Write-Info "Installing npm dependencies (first time only)..."
            npm install
        }
        
        npm run index:add $path
        Pop-Location
        
        Write-Success "Project indexed successfully"
    }
    
    "index-list" = {
        Write-Info "Listing indexed folders...`n"
        
        try {
            $body = @{
                jsonrpc = "2.0"
                id = 1
                method = "tools/call"
                params = @{
                    name = "mcp_mimir_list_folders"
                    arguments = @{}
                }
            } | ConvertTo-Json -Depth 10
            
            $response = Invoke-RestMethod -Uri "http://localhost:9042/mcp" -Method Post -Body $body -ContentType "application/json"
            
            if ($response.result -and $response.result.folders) {
                foreach ($folder in $response.result.folders) {
                    Write-Host "  📁 $($folder.path)" -ForegroundColor Cyan
                    Write-Host "     Files: $($folder.fileCount) | Patterns: $($folder.patterns -join ', ')"
                }
            } else {
                Write-Warn "No folders indexed yet"
            }
        } catch {
            Write-Fail "Failed to list folders: $_"
        }
    }
    
    "index-remove" = {
        if ($Args.Count -eq 0) {
            Write-Fail "Usage: .\m.ps1 index-remove <path>"
            return
        }
        
        $path = $Args[0]
        Write-Info "Removing folder from index: $path"
        
        try {
            $body = @{
                jsonrpc = "2.0"
                id = 1
                method = "tools/call"
                params = @{
                    name = "mcp_mimir_remove_folder"
                    arguments = @{
                        path = $path
                    }
                }
            } | ConvertTo-Json -Depth 10
            
            $null = Invoke-RestMethod -Uri "http://localhost:9042/mcp" -Method Post -Body $body -ContentType "application/json"
            Write-Success "Folder removed from index"
        } catch {
            Write-Fail "Failed to remove folder: $_"
        }
    }
    
    "memory" = {
        Write-Info "Running memory maintenance..."
        Push-Location "$MimirRoot\mimir"
        python memory_maintenance.py @Args
        Pop-Location
    }
    
    "query" = {
        if ($Args.Count -eq 0) {
            Write-Fail "Usage: .\m.ps1 query <search text>"
            Write-Info "Example: .\m.ps1 query `"workflow patterns`""
            return
        }
        
        $query = $Args -join " "
        Write-Info "Searching: $query`n"
        Invoke-MimirQuery -Query $query
    }
    
    "stats" = {
        Write-Info "Fetching memory statistics...`n"
        
        try {
            $body = @{
                jsonrpc = "2.0"
                id = 1
                method = "tools/call"
                params = @{
                    name = "mcp_mimir_get_embedding_stats"
                    arguments = @{}
                }
            } | ConvertTo-Json -Depth 10
            
            $response = Invoke-RestMethod -Uri "http://localhost:9042/mcp" -Method Post -Body $body -ContentType "application/json"
            
            if ($response.result) {
                Write-Host "Node Statistics:" -ForegroundColor Cyan
                $response.result.stats | ForEach-Object {
                    Write-Host "  $($_.type): $($_.count) nodes, $($_.with_embeddings) with embeddings"
                }
                Write-Host "`nTotal: $($response.result.total_nodes) nodes" -ForegroundColor Green
            }
        } catch {
            Write-Fail "Failed to get stats: $_"
        }
    }
    
    "dev" = {
        Write-Info "Starting development environment with hot reload..."
        Write-Warn "This will restart Mimir in dev mode (changes auto-reload)"
        Write-Info "Press Ctrl+C to stop"
        
        Push-Location "$MimirRoot\mimir"
        
        # Check if nodemon installed
        $null = npm list -g nodemon 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Installing nodemon globally..."
            npm install -g nodemon
        }
        
        # Start with hot reload
        npm run dev
        Pop-Location
    }
    
    "build" = {
        Write-Info "Building Mimir TypeScript..."
        Push-Location "$MimirRoot\mimir"
        npm run build
        Pop-Location
        Write-Success "Build complete"
    }
    
    "shell" = {
        $service = if ($Args.Count -gt 0) { $Args[0] } else { "mimir" }
        
        Write-Info "Opening shell in $service container..."
        $containerName = docker ps --filter "label=com.docker.compose.service=$service" --format "{{.Names}}" | Select-Object -First 1
        
        if (-not $containerName) {
            Write-Fail "Container not found for service: $service"
            return
        }
        
        docker exec -it $containerName /bin/sh
    }
    
    "security-scan" = {
        $projectPath = if ($Args.Count -gt 0) { $Args[0] } else { "." }
        
        Write-Info "Running comprehensive security scan on: $projectPath"
        Write-Warn "This will scan for: SAST, SCA, secrets, container vulnerabilities"
        
        Push-Location "$MimirRoot\tools"
        python security_scanner.py $projectPath --output-dir "$MimirRoot\security-reports"
        Pop-Location
    }
    
    "process-docs" = {
        if ($Args.Count -eq 0) {
            Write-Fail "Usage: .\m.ps1 process-docs <path-to-pdf-or-folder>"
            Write-Info "Example: .\m.ps1 process-docs C:\Documents\report.pdf"
            return
        }
        
        $docPath = $Args[0]
        Write-Info "Processing documents from: $docPath"
        
        Push-Location "$MimirRoot\tools"
        python document_processor.py $docPath
        Pop-Location
    }
    
    "prompt-version" = {
        $subcommand = if ($Args.Count -gt 0) { $Args[0] } else { "status" }
        $remainingArgs = if ($Args.Count -gt 1) { $Args[1..($Args.Count-1)] } else { @() }
        
        Push-Location $MimirRoot
        python tools\prompt_manager.py $subcommand @remainingArgs
        Pop-Location
    }
    
    "prompt-eval" = {
        if ($Args.Count -eq 0) {
            Write-Fail "Usage: .\m.ps1 prompt-eval <prompt-file>"
            Write-Info "Example: .\m.ps1 prompt-eval .agents\prompts\system\v3_coding_agent.txt"
            return
        }
        
        $promptFile = $Args[0]
        Write-Info "Evaluating prompt: $promptFile"
        
        Push-Location $MimirRoot
        python tools\prompt_evaluator.py evaluate $promptFile --save
        Pop-Location
    }
    
    "test-browser" = {
        if (-not (Test-DockerRunning)) { return }
        
        # Check if Playwright container is running
        $playwrightStatus = docker ps --filter "name=mimir_playwright" --format "{{.Status}}"
        
        if (-not $playwrightStatus) {
            Write-Info "Starting Playwright container..."
            Push-Location $MimirRoot
            docker-compose up -d playwright
            Pop-Location
            Start-Sleep -Seconds 5
        }
        
        # Build test command
        $testArgs = if ($Args.Count -gt 0) { $Args -join " " } else { "" }
        
        Write-Info "Running Playwright tests..."
        Write-Info "Test results will be saved to ./test-results/"
        
        
        docker exec -it mimir_playwright sh -c "cd /tests && npm install --silent && npx playwright test $testArgs"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Tests passed!"
            Write-Info "View report: npx playwright show-report test-results/html"
        } else {
            Write-Fail "Tests failed. Check test-results/ for details."
        }
    }
    
    "monitoring" = {
        if (-not (Test-DockerRunning)) { return }
        
        # Check if Grafana is running
        $grafanaStatus = docker ps --filter "name=mimir_grafana" --format "{{.Status}}"
        
        if (-not $grafanaStatus) {
            Write-Info "Starting monitoring stack (Prometheus + Grafana)..."
            Push-Location $MimirRoot
            docker-compose up -d prometheus grafana
            Pop-Location
            Start-Sleep -Seconds 10
        }
        
        Write-Success "Monitoring is running!"
        Write-Info "Grafana: http://localhost:3000 (admin/admin)"
        Write-Info "Prometheus: http://localhost:9090"
        
        # Open Grafana in browser
        Start-Process "http://localhost:3000"
    }
    
    "map-projects" = {
        if ($Args.Count -eq 0) {
            Write-Fail "Usage: .\m.ps1 map-projects <path1> [path2] [path3] ..."
            Write-Info "Example: .\m.ps1 map-projects C:\Projects\Github\7Days C:\Projects\AI_Orchestration"
            return
        }
        
        $projectCount = $Args.Count
        Write-Info "Mapping project dependencies across $projectCount projects..."
        
        Push-Location $MimirRoot
        python tools\project_mapper.py $Args --store
        Pop-Location
    }
}

# Execute command
if ($commands.ContainsKey($Command.ToLower())) {
    & $commands[$Command.ToLower()]
} else {
    Write-Fail "Unknown command: $Command"
    Write-Info "Run '.\m.ps1 help' for usage information"
    exit 1
}
