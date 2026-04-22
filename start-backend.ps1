$ErrorActionPreference = "Stop"

$Root = "C:\Users\YoungTyler\.openclaw\workspace\macro-terminal"
$Backend = Join-Path $Root "backend"

Set-Location $Backend

if (-not (Test-Path "requirements.txt")) {
  throw "backend/requirements.txt not found"
}

Write-Host "[macro-terminal] Installing backend deps if needed..."
python -m pip install -r requirements.txt

Write-Host "[macro-terminal] Starting backend on http://127.0.0.1:8000"
python -m uvicorn main:app --reload --port 8000
