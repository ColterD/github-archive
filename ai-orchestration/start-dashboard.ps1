#!/usr/bin/env pwsh
# Start the GitHub Coding Agent Real-Time Dashboard

Write-Host "🚀 Starting GitHub Coding Agent Dashboard..." -ForegroundColor Cyan

# Navigate to dashboard directory
Set-Location "$PSScriptRoot\mimir\dashboard"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start development server
Write-Host "🎯 Launching dashboard at http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "✨ Features:" -ForegroundColor Magenta
Write-Host "  - Real-time PR monitoring (updates every 15s)"
Write-Host "  - Agent activity tracking"
Write-Host "  - Code metrics visualization"
Write-Host "  - Live timeline of agent actions"
Write-Host ""
Write-Host "Press Ctrl+C to stop the dashboard" -ForegroundColor Gray
Write-Host ""

npm run dev
