$ErrorActionPreference = "Stop"

$Root = "C:\Users\YoungTyler\.openclaw\workspace\macro-terminal"
$Frontend = Join-Path $Root "frontend"

Set-Location $Frontend

if (-not (Test-Path "package.json")) {
  throw "frontend/package.json not found"
}

Write-Host "[macro-terminal] Installing frontend deps if needed..."
npm install

Write-Host "[macro-terminal] Starting frontend on http://127.0.0.1:5173"
npm run dev
