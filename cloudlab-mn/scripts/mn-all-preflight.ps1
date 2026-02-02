param()

$repo = Split-Path -Parent $PSScriptRoot

$ErrorActionPreference = "Stop"

Write-Host "== MN all-preflight =="
Write-Host "Repo: $repo"
Write-Host ""

Write-Host "[1/3] Windows preflight..."
& "$repo\scripts\mn-preflight.ps1"

Write-Host ""
Write-Host "[2/3] WSL local sync dry-run..."
wsl -d Debian -- bash -lc "~/src/cloudlab/scripts/local-sync-dryrun.sh"

Write-Host ""
Write-Host "[3/3] Utah preflight (will fail until utah.env has real values)..."
wsl -d Debian -- bash -lc "~/src/cloudlab/scripts/utah-preflight.sh" 

