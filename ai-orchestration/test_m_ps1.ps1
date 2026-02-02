# m.ps1 Test Script
# Tests all commands in the Mimir CLI

Write-Host "`n=== Testing Mimir CLI (m.ps1) ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Gray

$testResults = @()

function Test-Command {
    param([string]$Name, [string]$Command, [string]$Description)
    
    Write-Host "`n[$Name] $Description" -ForegroundColor Yellow
    Write-Host "Command: $Command" -ForegroundColor Gray
    
    try {
        $output = Invoke-Expression $Command 2>&1 | Select-Object -First 10
        $success = $LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE
        
        if ($success) {
            Write-Host "✓ PASS" -ForegroundColor Green
            $testResults += [PSCustomObject]@{Test=$Name; Result="PASS"; Output=$output}
        } else {
            Write-Host "✗ FAIL (Exit code: $LASTEXITCODE)" -ForegroundColor Red
            $testResults += [PSCustomObject]@{Test=$Name; Result="FAIL"; Output=$output}
        }
    } catch {
        Write-Host "✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += [PSCustomObject]@{Test=$Name; Result="ERROR"; Output=$_.Exception.Message}
    }
}

# Test basic commands
Test-Command "help" ".\m.ps1 help" "Display help text"
Test-Command "status" ".\m.ps1 status" "Show container status"
Test-Command "health" ".\m.ps1 health" "Check health endpoints"

# Test info commands (may fail if no data)
Test-Command "index-list" ".\m.ps1 index-list" "List indexed folders"

# Test Python integrations
Test-Command "prompt-version-status" "python tools\prompt_manager.py status" "Check prompt registry"
Test-Command "prompt-scenarios" "python tools\prompt_evaluator.py scenarios" "List test scenarios"

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
$passCount = ($testResults | Where-Object {$_.Result -eq "PASS"}).Count
$failCount = ($testResults | Where-Object {$_.Result -eq "FAIL"}).Count
$errorCount = ($testResults | Where-Object {$_.Result -eq "ERROR"}).Count

Write-Host "PASS:  $passCount" -ForegroundColor Green
Write-Host "FAIL:  $failCount" -ForegroundColor Red
Write-Host "ERROR: $errorCount" -ForegroundColor Yellow
Write-Host "TOTAL: $($testResults.Count)" -ForegroundColor Cyan

# Output results
Write-Host "`n=== Detailed Results ===" -ForegroundColor Cyan
$testResults | Format-Table -AutoSize

Write-Host "`nTest complete!" -ForegroundColor Cyan
