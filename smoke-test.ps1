$ErrorActionPreference = "Stop"

Write-Host "[smoke] Checking backend health..."
try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -Method Get
} catch {
  throw "Backend is not reachable on http://127.0.0.1:8000. Start backend first with .\start-backend.ps1"
}
if (-not $health.ok) {
  throw "Backend health check failed"
}
Write-Host "[smoke] /api/health OK"

Write-Host "[smoke] Checking snapshot..."
$snapshot = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/snapshot" -Method Get

if (-not $snapshot.market_pulse) {
  throw "Snapshot missing market_pulse"
}
if (-not $snapshot.futures_structure) {
  throw "Snapshot missing futures_structure"
}
if (-not $snapshot.scenario_engine) {
  throw "Snapshot missing scenario_engine"
}

Write-Host "[smoke] /api/snapshot OK"
Write-Host "[smoke] Scenario:" $snapshot.market_pulse.scenario
Write-Host "[smoke] UpdatedAt:" $snapshot.market_pulse.updated_at
Write-Host "[smoke] Done."
