# Quick Start Script - Run this first!

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           Mimir AI Orchestration - Quick Start                ║
║                                                                ║
║  This script will set up your AI memory/RAG stack             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Text)
    Write-Host "`n▶ $Text" -ForegroundColor Green
}

function Write-Substep {
    param([string]$Text)
    Write-Host "  • $Text" -ForegroundColor White
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "  ✗ $Text" -ForegroundColor Red
}

function Write-Success {
    param([string]$Text)
    Write-Host "  ✓ $Text" -ForegroundColor Green
}

try {
    # Step 1: Check prerequisites
    Write-Step "Step 1: Checking prerequisites"
    
    # Check Docker
    Write-Substep "Checking Docker..."
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
    }
    catch {
        Write-Error-Custom "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    # Check Git
    Write-Substep "Checking Git..."
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Success "Git is installed"
    }
    else {
        Write-Error-Custom "Git is not installed. Please install Git from https://git-scm.com/"
        exit 1
    }
    
    # Check Node.js (optional but recommended)
    Write-Substep "Checking Node.js..."
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = node --version
        Write-Success "Node.js is installed ($nodeVersion)"
    }
    else {
        Write-Host "  ⚠ Node.js not found (optional, but recommended for indexing)" -ForegroundColor Yellow
    }
    
    # Step 2: Clone Mimir
    Write-Step "Step 2: Cloning Mimir repository"
    
    if (Test-Path "mimir") {
        Write-Success "Mimir repository already exists"
    }
    else {
        Write-Substep "Cloning from GitHub..."
        git clone https://github.com/orneryd/Mimir.git mimir
        Write-Success "Mimir repository cloned"
    }
    
    # Step 3: Create environment file
    Write-Step "Step 3: Creating configuration"
    
    if (Test-Path ".env") {
        Write-Success ".env file already exists"
    }
    else {
        Write-Substep "Copying .env.example to .env..."
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env file"
        Write-Host "  ℹ You can edit .env to customize settings (optional)" -ForegroundColor Yellow
    }
    
    # Step 4: Start services
    Write-Step "Step 4: Starting Docker services"
    Write-Substep "This may take a few minutes on first run..."
    
    docker compose up -d
    
    Write-Success "Services started"
    
    # Step 5: Wait for health
    Write-Step "Step 5: Waiting for services to be healthy"
    Write-Substep "This usually takes 30-60 seconds..."
    
    $maxWait = 90
    $waited = 0
    $healthy = $false
    
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 5
        $waited += 5
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:9042/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $healthy = $true
                break
            }
        }
        catch {
            Write-Host "." -NoNewline
        }
    }
    
    Write-Host ""
    
    if ($healthy) {
        Write-Success "All services are healthy!"
    }
    else {
        Write-Host "  ⚠ Services are starting but not healthy yet. Check status with:" -ForegroundColor Yellow
        Write-Host "    docker compose ps" -ForegroundColor White
    }
    
    # Step 6: Pull embedding model
    Write-Step "Step 6: Downloading embedding model"
    Write-Substep "Pulling nomic-embed-text (~275MB)..."
    
    docker exec mimir_ollama ollama pull nomic-embed-text
    Write-Success "Embedding model ready"
    
    # Success!
    Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                    ✓ Setup Complete! 🎉                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

    Write-Host "Your Mimir AI Orchestration stack is now running!`n" -ForegroundColor Cyan
    
    Write-Host "Access Points:" -ForegroundColor Yellow
    Write-Host "  • Neo4j Browser:  http://localhost:7474" -ForegroundColor White
    Write-Host "    Login: neo4j / password" -ForegroundColor Gray
    Write-Host "  • MCP Server:     http://localhost:9042/health" -ForegroundColor White
    Write-Host "  • Ollama API:     http://localhost:11434" -ForegroundColor White
    
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "  1. Open Neo4j Browser and explore the graph database" -ForegroundColor White
    Write-Host "  2. Index a project for semantic search:" -ForegroundColor White
    Write-Host "     .\mimir-manage.ps1 index C:\Path\To\Your\Project" -ForegroundColor Gray
    Write-Host "  3. Read README.md for detailed usage instructions" -ForegroundColor White
    
    Write-Host "`nManagement Commands:" -ForegroundColor Yellow
    Write-Host "  .\mimir-manage.ps1 status    - Check service status" -ForegroundColor White
    Write-Host "  .\mimir-manage.ps1 logs      - View logs" -ForegroundColor White
    Write-Host "  .\mimir-manage.ps1 help      - Show all commands" -ForegroundColor White
    
    Write-Host "`nPress any key to open Neo4j Browser..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    Start-Process "http://localhost:7474"
}
catch {
    Write-Host "`n✗ Setup failed: $_" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check Docker is running: docker info" -ForegroundColor White
    Write-Host "  2. Check for port conflicts: docker compose ps" -ForegroundColor White
    Write-Host "  3. View logs: docker compose logs" -ForegroundColor White
    Write-Host "  4. See SETUP.md for detailed troubleshooting" -ForegroundColor White
    exit 1
}
