# orchestrate.ps1 - AI_Orchestration Multi-Agent Automation
# Full end-to-end autonomous agent spawning and management

param(
    [Parameter(Mandatory=$false)]
    [string]$Mode = "auto", # auto, manual, monitor
    
    [Parameter(Mandatory=$false)]
    [int]$PollingIntervalSeconds = 30
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Configuration
$REPO_ROOT = $PSScriptRoot
$MIMIR_API = "http://localhost:9042"
$NEO4J_URI = "bolt://localhost:7687"
$AGENTS_DIR = Join-Path $REPO_ROOT ".github\agents"
$LOGS_DIR = Join-Path $REPO_ROOT "logs\orchestration"
$SESSION_DIR = Join-Path $LOGS_DIR "sessions"

# Ensure directories exist
@($LOGS_DIR, $SESSION_DIR) | ForEach-Object {
    if (!(Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

# Logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path (Join-Path $LOGS_DIR "orchestrator.log") -Value $logMessage
}

# Mimir API functions
function Get-MimirPendingTasks {
    try {
        $response = Invoke-RestMethod -Uri "$MIMIR_API/api/todos?status=pending" -Method GET
        return $response.todos
    }
    catch {
        Write-Log "Failed to get pending tasks from Mimir: $($_.Exception.Message)" -Level "ERROR"
        return @()
    }
}

function Update-MimirTask {
    param(
        [string]$TaskId,
        [string]$Status,
        [hashtable]$Metadata = @{}
    )
    
    try {
        $body = @{
            id = $TaskId
            status = $Status
            metadata = $Metadata
            updatedAt = (Get-Date).ToUniversalTime().ToString("o")
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$MIMIR_API/api/todos/$TaskId" -Method PATCH -Body $body -ContentType "application/json"
        Write-Log "Updated task $TaskId to status: $Status"
    }
    catch {
        Write-Log "Failed to update task $TaskId`: $($_.Exception.Message)" -Level "ERROR"
    }
}

function Get-MimirTask {
    param([string]$TaskId)
    
    try {
        $response = Invoke-RestMethod -Uri "$MIMIR_API/api/todos/$TaskId" -Method GET
        return $response.todo
    }
    catch {
        Write-Log "Failed to get task $TaskId`: $($_.Exception.Message)" -Level "WARN"
        return $null
    }
}

# Agent session management
$ActiveSessions = @{}

function Start-AgentSession {
    param(
        [string]$AgentName,
        [string]$TaskId,
        [string]$TaskDescription,
        [hashtable]$Context = @{}
    )
    
    Write-Log "Starting $AgentName agent for task $TaskId"
    
    # Create session log file
    $sessionId = [guid]::NewGuid().ToString().Substring(0, 8)
    $sessionLog = Join-Path $SESSION_DIR "$AgentName-$sessionId-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
    
    # Build context prompt
    $contextPrompt = @"
TASK ID: $TaskId
TASK: $TaskDescription

CONTEXT:
$($Context | ConvertTo-Json -Depth 5)

INSTRUCTIONS:
1. Query Mimir for task details using task ID: $TaskId
2. Execute the task according to your specialist role
3. Update Mimir with progress using task ID
4. Mark task complete when done
5. Report any blockers immediately

BEGIN EXECUTION NOW.
"@
    
    # Save context to file for agent to reference
    $contextFile = Join-Path $SESSION_DIR "$sessionId-context.txt"
    $contextPrompt | Out-File -FilePath $contextFile -Encoding UTF8
    
    # Start PowerShell job that runs gh copilot
    $jobScript = {
        param($AgentName, $ContextFile, $SessionLog, $RepoRoot)
        
        Set-Location $RepoRoot
        
        # Read context
        $context = Get-Content $ContextFile -Raw
        
        # Start gh copilot in interactive mode with agent
        # Note: This is a simplified version. Real implementation would need
        # to handle stdin/stdout piping for true automation
        Start-Process -FilePath "gh" -ArgumentList @(
            "copilot",
            "--agent", $AgentName
        ) -NoNewWindow -RedirectStandardOutput $SessionLog -Wait
    }
    
    $job = Start-Job -ScriptBlock $jobScript -ArgumentList $AgentName, $contextFile, $sessionLog, $REPO_ROOT
    
    # Track session
    $ActiveSessions[$sessionId] = @{
        AgentName = $AgentName
        TaskId = $TaskId
        Job = $job
        SessionLog = $sessionLog
        ContextFile = $contextFile
        StartTime = Get-Date
        Status = "running"
    }
    
    Write-Log "Agent $AgentName session $sessionId started for task $TaskId"
    
    return $sessionId
}

function Get-AgentSessionStatus {
    param([string]$SessionId)
    
    if (!$ActiveSessions.ContainsKey($SessionId)) {
        return $null
    }
    
    $session = $ActiveSessions[$SessionId]
    $job = $session.Job
    
    # Update job status
    if ($job.State -eq "Completed") {
        $session.Status = "completed"
        $session.EndTime = Get-Date
        $session.Duration = ($session.EndTime - $session.StartTime).TotalSeconds
        
        Write-Log "Agent $($session.AgentName) session $SessionId completed after $($session.Duration)s"
    }
    elseif ($job.State -eq "Failed") {
        $session.Status = "failed"
        $session.Error = Receive-Job $job 2>&1
        Write-Log "Agent $($session.AgentName) session $SessionId FAILED: $($session.Error)" -Level "ERROR"
    }
    
    return $session
}

function Stop-AgentSession {
    param([string]$SessionId)
    
    if ($ActiveSessions.ContainsKey($SessionId)) {
        $session = $ActiveSessions[$SessionId]
        Stop-Job $session.Job -ErrorAction SilentlyContinue
        Remove-Job $session.Job -Force -ErrorAction SilentlyContinue
        $ActiveSessions.Remove($SessionId)
        
        Write-Log "Stopped agent session $SessionId"
    }
}

# Task assignment logic
function Get-AgentForTask {
    param([object]$Task)
    
    $description = $Task.title + " " + $Task.description
    $descriptionLower = $description.ToLower()
    
    # Simple keyword-based routing (can be enhanced with LLM later)
    $agentMap = @{
        "architecture|design|adr|technical decision" = "architect"
        "ui|frontend|react|component|typescript" = "frontend"
        "api|backend|database|server|endpoint" = "backend"
        "docker|deploy|ci/cd|infrastructure" = "devops"
        "test|qa|quality|coverage|review" = "qc"
        "cleanup|janitor|documentation|maintenance" = "janitor"
        "risk|security|vulnerability|threat" = "devils-advocate"
    }
    
    foreach ($pattern in $agentMap.Keys) {
        if ($descriptionLower -match $pattern) {
            return $agentMap[$pattern]
        }
    }
    
    # Default: send complex tasks to architect for triage
    return "architect"
}

# Main orchestration loop
function Start-Orchestration {
    Write-Log "=== AI_Orchestration Started (Mode: $Mode) ==="
    Write-Log "Mimir API: $MIMIR_API"
    Write-Log "Repository: $REPO_ROOT"
    Write-Log "Polling interval: $PollingIntervalSeconds seconds"
    
    $iteration = 0
    
    while ($true) {
        $iteration++
        Write-Log "--- Iteration $iteration ---"
        
        # Check Mimir for pending tasks
        $pendingTasks = Get-MimirPendingTasks
        Write-Log "Found $($pendingTasks.Count) pending tasks"
        
        foreach ($task in $pendingTasks) {
            $taskId = $task.id
            
            # Skip if already being processed by an active session
            $alreadyProcessing = $ActiveSessions.Values | Where-Object { $_.TaskId -eq $taskId -and $_.Status -eq "running" }
            if ($alreadyProcessing) {
                Write-Log "Task $taskId already being processed by $($alreadyProcessing.AgentName)"
                continue
            }
            
            # Determine which agent should handle this
            $agentName = Get-AgentForTask $task
            
            # Check if agent is available (max 1 session per agent type)
            $agentBusy = $ActiveSessions.Values | Where-Object { $_.AgentName -eq $agentName -and $_.Status -eq "running" }
            if ($agentBusy) {
                Write-Log "Agent $agentName is busy, queuing task $taskId"
                continue
            }
            
            # Start agent session
            Update-MimirTask -TaskId $taskId -Status "in-progress" -Metadata @{
                assignedTo = $agentName
                assignedAt = (Get-Date).ToUniversalTime().ToString("o")
            }
            
            $sessionId = Start-AgentSession -AgentName $agentName -TaskId $taskId -TaskDescription $task.description -Context @{
                priority = $task.priority
                project = $task.project
                tags = $task.tags
            }
        }
        
        # Check status of active sessions
        $completedSessions = @()
        foreach ($sessionId in $ActiveSessions.Keys) {
            $status = Get-AgentSessionStatus -SessionId $sessionId
            
            if ($status.Status -eq "completed") {
                # Mark task as completed in Mimir
                Update-MimirTask -TaskId $status.TaskId -Status "completed" -Metadata @{
                    completedBy = $status.AgentName
                    completedAt = (Get-Date).ToUniversalTime().ToString("o")
                    duration = $status.Duration
                }
                
                $completedSessions += $sessionId
            }
            elseif ($status.Status -eq "failed") {
                # Mark task as failed
                Update-MimirTask -TaskId $status.TaskId -Status "failed" -Metadata @{
                    error = $status.Error
                    failedAt = (Get-Date).ToUniversalTime().ToString("o")
                }
                
                $completedSessions += $sessionId
            }
        }
        
        # Clean up completed sessions
        foreach ($sessionId in $completedSessions) {
            Stop-AgentSession -SessionId $sessionId
        }
        
        # Status report
        $activeSessions = $ActiveSessions.Values | Where-Object { $_.Status -eq "running" }
        Write-Log "Active sessions: $($activeSessions.Count)"
        foreach ($session in $activeSessions) {
            $runtime = ((Get-Date) - $session.StartTime).TotalMinutes
            Write-Log "  - $($session.AgentName) on $($session.TaskId) (running for $([math]::Round($runtime, 1)) min)"
        }
        
        # Manual mode: exit after one iteration
        if ($Mode -eq "manual") {
            Write-Log "Manual mode: Exiting after one iteration"
            break
        }
        
        # Sleep before next poll
        Start-Sleep -Seconds $PollingIntervalSeconds
    }
}

# Cleanup on exit
$cleanupScript = {
    Write-Log "=== Orchestration Shutting Down ==="
    
    # Stop all active sessions
    foreach ($sessionId in $script:ActiveSessions.Keys) {
        Stop-AgentSession -SessionId $sessionId
    }
    
    Write-Log "Orchestration stopped"
}

Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $cleanupScript

# Start orchestration
try {
    Start-Orchestration
}
catch {
    Write-Log "Orchestration failed: $($_.Exception.Message)" -Level "ERROR"
    throw
}
finally {
    & $cleanupScript
}
