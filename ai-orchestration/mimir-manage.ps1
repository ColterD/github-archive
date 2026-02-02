# Mimir AI Orchestration - Management Script
# Provides easy commands to manage the Mimir stack

param(
    [Parameter(Position=0)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs', 'setup', 'index', 'health', 'clean', 'help')]
    [string]$Command = 'help',
    
    [Parameter(Position=1)]
    [string]$Path,
    
    [switch]$Follow
)

$ErrorActionPreference = 'Stop'

function Write-Header {
    param([string]$Text)
    Write-Host "`n=== $Text ===" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✓ $Text" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "✗ $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ $Text" -ForegroundColor Yellow
}

function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-Error-Custom "Docker is not running. Please start Docker Desktop."
        exit 1
    }
}

function Start-Services {
    Write-Header "Starting Mimir Services"
    Test-DockerRunning
    
    if (-not (Test-Path ".env")) {
        Write-Info "No .env file found. Creating from .env.example..."
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env file"
    }
    
    Write-Info "Starting Docker containers..."
    docker compose up -d
    
    Write-Info "Waiting for services to be healthy..."
    Start-Sleep -Seconds 10
    
    $maxWait = 60
    $waited = 0
    while ($waited -lt $maxWait) {
        $status = docker compose ps --format json | ConvertFrom-Json
        $allHealthy = $true
        
        foreach ($service in $status) {
            if ($service.Health -ne "healthy" -and $service.Service -ne "ollama") {
                $allHealthy = $false
                break
            }
        }
        
        if ($allHealthy) {
            Write-Success "All services are healthy!"
            break
        }
        
        Start-Sleep -Seconds 5
        $waited += 5
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    Get-Status
}

function Stop-Services {
    Write-Header "Stopping Mimir Services"
    Test-DockerRunning
    docker compose down
    Write-Success "Services stopped"
}

function Restart-Services {
    Write-Header "Restarting Mimir Services"
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services
}

function Get-Status {
    Write-Header "Service Status"
    Test-DockerRunning
    docker compose ps
    
    Write-Host "`nAccess Points:" -ForegroundColor Cyan
    Write-Host "  Neo4j Browser:  http://localhost:7474" -ForegroundColor White
    Write-Host "  MCP Server:     http://localhost:9042/health" -ForegroundColor White
    Write-Host "  Ollama API:     http://localhost:11434" -ForegroundColor White
}

function Show-Logs {
    Write-Header "Service Logs"
    Test-DockerRunning
    
    if ($Follow) {
        docker compose logs -f
    }
    else {
        docker compose logs --tail=50
    }
}

function Test-Health {
    Write-Header "Health Check"
    Test-DockerRunning
    
    Write-Host "`nChecking MCP Server..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9042/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "MCP Server is healthy"
        }
    }
    catch {
        Write-Error-Custom "MCP Server is not responding"
    }
    
    Write-Host "`nChecking Neo4j..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:7474" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Neo4j Browser is accessible"
        }
    }
    catch {
        Write-Error-Custom "Neo4j is not responding"
    }
    
    Write-Host "`nChecking Ollama..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -TimeoutSec 5
        Write-Success "Ollama is running"
    }
    catch {
        Write-Error-Custom "Ollama is not responding"
    }
    
    Write-Host "`nChecking Ollama models..."
    try {
        $models = docker exec mimir_ollama ollama list
        Write-Host $models
    }
    catch {
        Write-Error-Custom "Could not list Ollama models"
    }
}

function Invoke-Setup {
    Write-Header "Setting up Mimir AI Orchestration"
    
    # Check prerequisites
    Write-Info "Checking prerequisites..."
    Test-DockerRunning
    
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "Git is not installed. Please install Git first."
        exit 1
    }
    Write-Success "Git is installed"
    
    # Clone Mimir if not exists
    if (-not (Test-Path "mimir")) {
        Write-Info "Cloning Mimir repository..."
        git clone https://github.com/orneryd/Mimir.git mimir
        Write-Success "Mimir repository cloned"
    }
    else {
        Write-Success "Mimir repository already exists"
    }
    
    # Create .env if not exists
    if (-not (Test-Path ".env")) {
        Write-Info "Creating .env file..."
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env file"
    }
    else {
        Write-Success ".env file already exists"
    }
    
    # Start services
    Start-Services
    
    # Pull embedding model
    Write-Info "Pulling embedding model (this may take a few minutes)..."
    docker exec mimir_ollama ollama pull nomic-embed-text
    Write-Success "Embedding model ready"
    
    Write-Host "`n"
    Write-Success "Setup complete!"
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Visit Neo4j Browser: http://localhost:7474" -ForegroundColor White
    Write-Host "     Login: neo4j / password" -ForegroundColor White
    Write-Host "  2. Index a project: .\mimir-manage.ps1 index C:\Path\To\Your\Project" -ForegroundColor White
    Write-Host "  3. Read README.md for usage instructions" -ForegroundColor White
}

function Add-Index {
    param([string]$ProjectPath)
    
    if (-not $ProjectPath) {
        Write-Error-Custom "Please provide a path to index"
        Write-Host "Usage: .\mimir-manage.ps1 index C:\Path\To\Your\Project" -ForegroundColor Yellow
        exit 1
    }
    
    if (-not (Test-Path $ProjectPath)) {
        Write-Error-Custom "Path does not exist: $ProjectPath"
        exit 1
    }
    
    Write-Header "Indexing Project"
    Write-Info "Path: $ProjectPath"
    
    # Convert to absolute path
    $absolutePath = Resolve-Path $ProjectPath
    
    Write-Info "Installing dependencies (first time only)..."
    Push-Location mimir
    npm install
    
    Write-Info "Indexing files..."
    npm run index:add $absolutePath
    
    Pop-Location
    Write-Success "Indexing complete!"
}

function Clear-Data {
    Write-Header "Clean Up"
    Write-Host "This will remove all containers, volumes, and data!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (type 'yes' to confirm)"
    
    if ($confirm -eq 'yes') {
        Write-Info "Stopping services..."
        docker compose down -v
        
        Write-Info "Removing data directories..."
        if (Test-Path "data") { Remove-Item -Recurse -Force "data" }
        if (Test-Path "logs") { Remove-Item -Recurse -Force "logs" }
        
        Write-Success "Cleanup complete"
    }
    else {
        Write-Info "Cleanup cancelled"
    }
}

function Show-Help {
    Write-Host @"

Mimir AI Orchestration - Management Script

USAGE:
    .\mimir-manage.ps1 [command] [options]

COMMANDS:
    setup       Initial setup (clone repo, create .env, start services)
    start       Start all services
    stop        Stop all services
    restart     Restart all services
    status      Show service status and access points
    logs        Show service logs (-Follow for live logs)
    health      Check health of all services
    index       Index a project for semantic search
                Usage: .\mimir-manage.ps1 index C:\Path\To\Project
    clean       Remove all data and containers (WARNING: destructive!)
    help        Show this help message

EXAMPLES:
    # First time setup
    .\mimir-manage.ps1 setup

    # Start services
    .\mimir-manage.ps1 start

    # Check status
    .\mimir-manage.ps1 status

    # View live logs
    .\mimir-manage.ps1 logs -Follow

    # Index a project
    .\mimir-manage.ps1 index C:\Users\Colter\Desktop\Projects\Github\7Days

    # Check health
    .\mimir-manage.ps1 health

ACCESS POINTS:
    Neo4j Browser:  http://localhost:7474 (neo4j/password)
    MCP Server:     http://localhost:9042/health
    Ollama API:     http://localhost:11434

"@
}

# Main command dispatcher
switch ($Command) {
    'start'   { Start-Services }
    'stop'    { Stop-Services }
    'restart' { Restart-Services }
    'status'  { Get-Status }
    'logs'    { Show-Logs }
    'setup'   { Invoke-Setup }
    'index'   { Add-Index -ProjectPath $Path }
    'health'  { Test-Health }
    'clean'   { Clear-Data }
    'help'    { Show-Help }
    default   { Show-Help }
}
