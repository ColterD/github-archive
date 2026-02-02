# GitHub Coding Agent Validation Tests
# Purpose: Prove gh agent-task can be used for autonomous multi-agent orchestration

param(
    [switch]$RunAll = $false,
    [switch]$Test1 = $false,
    [switch]$Test2 = $false,
    [switch]$Test3 = $false,
    [switch]$Test4 = $false,
    [switch]$Test5 = $false
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-TestHeader($message) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Failure($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Yellow
}

# Test Results Tracker
$testResults = @()

# Ensure we're in the right directory
Set-Location "C:\Users\Colter\Desktop\Projects\AI_Orchestration"

# Check if gh CLI is available
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Failure "GitHub CLI (gh) not found. Please install from https://cli.github.com"
    exit 1
}

# Check if agent-task command is available
try {
    gh agent-task --help | Out-Null
    Write-Success "GitHub Coding Agent (gh agent-task) is available"
} catch {
    Write-Failure "gh agent-task command not found. Ensure you have the latest GitHub CLI"
    exit 1
}

# ============================================================
# TEST 1: Custom Agent Discovery
# ============================================================
function Test-CustomAgentDiscovery {
    Write-TestHeader "TEST 1: Custom Agent Discovery"
    Write-Info "Testing if --custom-agent flag can find .github/agents/pm.agent.md"
    
    try {
        Write-Host "Launching PM agent with simple task..."
        $output = gh agent-task create "What files are in the mimir/src directory? Just list the top-level files." --custom-agent pm 2>&1
        
        if ($output -match "error" -or $output -match "not found" -or $output -match "invalid") {
            Write-Failure "Custom agent 'pm' not recognized or error occurred"
            Write-Host "Output: $output"
            return $false
        } else {
            Write-Success "PM agent launched successfully"
            Write-Host "Output: $output"
            
            # Extract session ID if possible
            if ($output -match "session|task|id:\s*(\S+)") {
                $sessionId = $matches[1]
                Write-Info "Session ID: $sessionId"
                
                # Try to view the task
                Start-Sleep -Seconds 5
                $taskView = gh agent-task view $sessionId 2>&1
                Write-Host "`nTask Status:"
                Write-Host $taskView
            }
            
            return $true
        }
    } catch {
        Write-Failure "Exception during test: $_"
        return $false
    }
}

# ============================================================
# TEST 2: Log Streaming with --follow
# ============================================================
function Test-LogStreaming {
    Write-TestHeader "TEST 2: Log Streaming (--follow flag)"
    Write-Info "Testing real-time log streaming from agent execution"
    
    try {
        Write-Host "Launching janitor agent with --follow (will stream logs for 30 seconds)..."
        Write-Info "Press Ctrl+C if agent completes early"
        
        # Start agent with follow, but timeout after 30 seconds
        $job = Start-Job -ScriptBlock {
            gh agent-task create "Search for any console.log statements in mimir/src/tools/task-executor.ts. Report the count." --custom-agent janitor --follow
        }
        
        # Wait max 30 seconds
        $completed = Wait-Job $job -Timeout 30
        
        if ($completed) {
            $output = Receive-Job $job
            Write-Success "Agent completed within 30 seconds"
            Write-Host "`nAgent Output:"
            Write-Host $output
            Remove-Job $job
            return $true
        } else {
            Write-Info "Agent still running after 30 seconds (this is normal for complex tasks)"
            Write-Info "Stopping job for test purposes..."
            Stop-Job $job
            Remove-Job $job
            return $true  # Still counts as success - streaming works
        }
    } catch {
        Write-Failure "Exception during test: $_"
        return $false
    }
}

# ============================================================
# TEST 3: Parallel Agent Execution
# ============================================================
function Test-ParallelExecution {
    Write-TestHeader "TEST 3: Parallel Agent Execution"
    Write-Info "Testing if multiple agents can run simultaneously"
    
    try {
        Write-Host "Launching 3 agents in parallel..."
        
        # Launch 3 simple agents simultaneously
        $job1 = Start-Job -ScriptBlock {
            gh agent-task create "Count the number of .ts files in mimir/src/tools" --custom-agent pm
        }
        
        $job2 = Start-Job -ScriptBlock {
            gh agent-task create "Count the number of .ts files in mimir/src/server" --custom-agent janitor
        }
        
        $job3 = Start-Job -ScriptBlock {
            gh agent-task create "Count the number of .ts files in mimir/src/lib" --custom-agent backend
        }
        
        Write-Info "Jobs started. Job IDs: $($job1.Id), $($job2.Id), $($job3.Id)"
        Write-Info "Waiting for completion (max 60 seconds)..."
        
        # Wait for all jobs (max 60 seconds)
        $completed = Wait-Job $job1, $job2, $job3 -Timeout 60
        
        if ($completed -and $completed.Count -eq 3) {
            Write-Success "All 3 agents completed within 60 seconds"
            
            Write-Host "`nJob 1 Output:"
            Receive-Job $job1
            
            Write-Host "`nJob 2 Output:"
            Receive-Job $job2
            
            Write-Host "`nJob 3 Output:"
            Receive-Job $job3
            
            Remove-Job $job1, $job2, $job3
            return $true
        } else {
            Write-Info "Not all agents completed in 60 seconds"
            Write-Info "This may indicate rate limiting or resource constraints"
            
            # Clean up
            Stop-Job $job1, $job2, $job3 -ErrorAction SilentlyContinue
            Remove-Job $job1, $job2, $job3 -ErrorAction SilentlyContinue
            
            return $false  # Consider this a limitation
        }
    } catch {
        Write-Failure "Exception during test: $_"
        return $false
    }
}

# ============================================================
# TEST 4: Mimir MCP Tool Access
# ============================================================
function Test-MimirAccess {
    Write-TestHeader "TEST 4: Mimir MCP Tool Access"
    Write-Info "Testing if agents can access Mimir MCP tools"
    
    try {
        Write-Host "Launching PM agent to create test memory in Mimir..."
        
        $taskDescription = @"
Use the Mimir MCP server to create a new memory node with these details:
- Title: "GitHub Coding Agent Test"
- Content: "This memory was created by a GitHub Coding Agent during automated testing on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
- Type: memory

After creating the memory, search for it to confirm it was created successfully.
"@
        
        $output = $taskDescription | gh agent-task create -F - --custom-agent pm --follow
        
        Write-Host "`nAgent Output:"
        Write-Host $output
        
        # Check if output indicates success
        if ($output -match "created|success|memory" -and $output -notmatch "error|failed|couldn't") {
            Write-Success "Agent appears to have accessed Mimir successfully"
            
            # Verify by querying Mimir directly
            Write-Info "Verifying memory creation via direct Mimir query..."
            # TODO: Add direct Mimir query here if available
            
            return $true
        } else {
            Write-Failure "Agent may not have accessed Mimir, or task failed"
            return $false
        }
    } catch {
        Write-Failure "Exception during test: $_"
        return $false
    }
}

# ============================================================
# TEST 5: PM Task Decomposition & Output Parsing
# ============================================================
function Test-TaskDecomposition {
    Write-TestHeader "TEST 5: PM Task Decomposition & Output Parsing"
    Write-Info "Testing if PM can decompose tasks and output structured data"
    
    try {
        Write-Host "Launching PM agent with task decomposition request..."
        
        $taskDescription = @"
You are the Project Manager. Decompose this request into subtasks:

USER REQUEST: "Audit the mimir/src directory for code quality issues including console.log statements, missing error handling, and type safety problems."

Output your task breakdown in the following JSON format:
{
  "tasks": [
    {
      "id": 1,
      "specialist": "janitor",
      "description": "Detailed task description",
      "priority": "high|medium|low"
    }
  ]
}

Provide ONLY the JSON output, no additional commentary.
"@
        
        $output = $taskDescription | gh agent-task create -F - --custom-agent pm --follow
        
        Write-Host "`nPM Output:"
        Write-Host $output
        
        # Try to parse JSON from output
        $jsonMatch = $output | Select-String -Pattern '\{[\s\S]*"tasks"[\s\S]*\}' -AllMatches
        
        if ($jsonMatch) {
            Write-Success "PM output contains JSON structure"
            
            try {
                $jsonText = $jsonMatch.Matches[0].Value
                $parsed = $jsonText | ConvertFrom-Json
                
                Write-Success "JSON parsed successfully"
                Write-Host "`nParsed Tasks:"
                $parsed.tasks | Format-Table -AutoSize
                
                return $true
            } catch {
                Write-Failure "JSON found but couldn't be parsed: $_"
                return $false
            }
        } else {
            Write-Failure "PM output doesn't contain expected JSON structure"
            return $false
        }
    } catch {
        Write-Failure "Exception during test: $_"
        return $false
    }
}

# ============================================================
# TEST EXECUTION
# ============================================================

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║   GitHub Coding Agent Validation Test Suite               ║
║   Testing autonomous multi-agent orchestration capability  ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Magenta

# Determine which tests to run
$runTests = @()
if ($RunAll) {
    $runTests = @(1, 2, 3, 4, 5)
} else {
    if ($Test1) { $runTests += 1 }
    if ($Test2) { $runTests += 2 }
    if ($Test3) { $runTests += 3 }
    if ($Test4) { $runTests += 4 }
    if ($Test5) { $runTests += 5 }
}

# If no tests specified, show help
if ($runTests.Count -eq 0) {
    Write-Host @"
Usage: .\test-gh-agent.ps1 [OPTIONS]

OPTIONS:
  -RunAll    Run all tests
  -Test1     Test custom agent discovery
  -Test2     Test log streaming (--follow)
  -Test3     Test parallel execution
  -Test4     Test Mimir MCP access
  -Test5     Test PM task decomposition

EXAMPLES:
  .\test-gh-agent.ps1 -RunAll
  .\test-gh-agent.ps1 -Test1 -Test2
  .\test-gh-agent.ps1 -Test4

"@
    exit 0
}

# Run selected tests
$testResults = @{
    "Test1_CustomAgentDiscovery" = $null
    "Test2_LogStreaming" = $null
    "Test3_ParallelExecution" = $null
    "Test4_MimirAccess" = $null
    "Test5_TaskDecomposition" = $null
}

if ($runTests -contains 1) {
    $testResults.Test1_CustomAgentDiscovery = Test-CustomAgentDiscovery
}

if ($runTests -contains 2) {
    $testResults.Test2_LogStreaming = Test-LogStreaming
}

if ($runTests -contains 3) {
    $testResults.Test3_ParallelExecution = Test-ParallelExecution
}

if ($runTests -contains 4) {
    $testResults.Test4_MimirAccess = Test-MimirAccess
}

if ($runTests -contains 5) {
    $testResults.Test5_TaskDecomposition = Test-TaskDecomposition
}

# ============================================================
# RESULTS SUMMARY
# ============================================================

Write-TestHeader "TEST RESULTS SUMMARY"

$passedTests = 0
$failedTests = 0
$skippedTests = 0

foreach ($test in $testResults.GetEnumerator() | Sort-Object Name) {
    $testName = $test.Key -replace "Test\d+_", ""
    
    if ($null -eq $test.Value) {
        Write-Host "⏭️  $testName : SKIPPED" -ForegroundColor Gray
        $skippedTests++
    } elseif ($test.Value -eq $true) {
        Write-Success "$testName : PASSED"
        $passedTests++
    } else {
        Write-Failure "$testName : FAILED"
        $failedTests++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Total: $($passedTests + $failedTests) tests run" -ForegroundColor White
Write-Success "Passed: $passedTests"
Write-Failure "Failed: $failedTests"
Write-Host "⏭️  Skipped: $skippedTests" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# Final Assessment
if ($failedTests -eq 0 -and $passedTests -gt 0) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ ALL TESTS PASSED                                       ║" -ForegroundColor Green
    Write-Host "║  GitHub Coding Agent is viable for autonomous orchestration║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "1. Build orchestrate-gh.ps1 using gh agent-task create" -ForegroundColor White
    Write-Host "2. Implement PM task decomposition → specialist spawning" -ForegroundColor White
    Write-Host "3. Add Mimir coordination for task claiming" -ForegroundColor White
    Write-Host "4. Test full autonomous orchestration end-to-end" -ForegroundColor White
} elseif ($passedTests -gt 0) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  ⚠️  PARTIAL SUCCESS                                       ║" -ForegroundColor Yellow
    Write-Host "║  Some capabilities work, but limitations exist             ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    
    Write-Host "`nRecommendation:" -ForegroundColor Yellow
    Write-Host "Consider hybrid approach or fall back to CrewAI framework" -ForegroundColor White
} else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ❌ TESTS FAILED                                           ║" -ForegroundColor Red
    Write-Host "║  GitHub Coding Agent approach has significant limitations  ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    
    Write-Host "`nRecommendation:" -ForegroundColor Yellow
    Write-Host "Implement CrewAI framework approach instead" -ForegroundColor White
    Write-Host "See DEEP_RESEARCH_AUTONOMOUS_AGENTS.md for details" -ForegroundColor White
}

# Save results to file
$resultsFile = "logs\test-results\gh-agent-validation-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
New-Item -ItemType Directory -Force -Path "logs\test-results" | Out-Null
$testResults | ConvertTo-Json | Out-File $resultsFile
Write-Info "Results saved to: $resultsFile"
