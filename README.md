# Macro Terminal (FastAPI + React)

## What It Is
- Local split-view market terminal for your SOL workflow.
- Reads your existing state files and renders:
  - Market Pulse
  - Futures Structure
  - Scenario Engine

## Project Layout
- `backend/main.py` - FastAPI API (`/api/health`, `/api/snapshot`)
- `backend/requirements.txt` - Python deps
- `frontend/` - React + Vite UI

## Run Backend
1. Open terminal in `macro-terminal/backend`
2. Install deps:
   - `python -m pip install -r requirements.txt`
3. Start API:
   - `uvicorn main:app --reload --port 8000`
   - or проще: `powershell -ExecutionPolicy Bypass -File .\start-backend.ps1`

## Run Frontend
1. Open terminal in `macro-terminal/frontend`
2. Install deps:
   - `npm install`
3. Start UI:
   - `npm run dev`
   - or проще: `powershell -ExecutionPolicy Bypass -File .\start-frontend.ps1`
4. Open:
   - `http://127.0.0.1:5173`

## Smoke Test
- After backend is running:
  - `powershell -ExecutionPolicy Bypass -File .\smoke-test.ps1`
- Expected:
  - `/api/health OK`
  - `/api/snapshot OK`

## Free Deploy (Render)

Use `render.yaml` from this folder:
- `macro-terminal/render.yaml`

It defines two free services:
- `young-macro-terminal-api` (FastAPI)
- `young-macro-terminal-ui` (static React)

### Steps
1. Push project to GitHub.
2. In Render: `New` -> `Blueprint`.
3. Select your repo and deploy using `macro-terminal/render.yaml`.
4. After first deploy, update service URLs if names differ:
   - API `CORS_ORIGINS`
   - UI `VITE_API_BASE`

### Notes
- Backend reads state from `STATE_ROOT` (defaults to project root if unset).
- Frontend reads API URL from `VITE_API_BASE`.
- Local run still works with default `http://127.0.0.1:8000`.

## Data Source
- API reads:
  - `state/trading-sol-hourly-state.json`
  - `state/trading-sol-hourly-monitor.json`
  - `data/trading-sol-hourly/latest-state.json`

## Next Up (if you want)
- Add live macros (DXY, US10Y, SPX, VIX) from public APIs.
- Add SOL mini-chart and alerts stream panel.
- Add command box: `анализ SOL` with full reader output.
