from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BASE_DIR = Path(os.getenv("STATE_ROOT", str(PROJECT_ROOT)))
STATE_MAIN = BASE_DIR / "state" / "trading-sol-hourly-state.json"
STATE_MIRROR = BASE_DIR / "state" / "trading-sol-hourly-monitor.json"
STATE_LATEST = BASE_DIR / "data" / "trading-sol-hourly" / "latest-state.json"

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    from fetch_sol_price import fetch_all  # type: ignore
except Exception:
    fetch_all = None


def _read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _format_state(raw: dict[str, Any]) -> dict[str, Any]:
    return {
        "symbol": raw.get("symbol", "SOLUSDT"),
        "updated_at": raw.get("updated_at"),
        "scenario": raw.get("scenario", "no trade"),
        "context_state": raw.get("context_state", "нет данных"),
        "control_state": raw.get("control_state", "нет данных"),
        "upper_level": raw.get("upper_level"),
        "lower_level": raw.get("lower_level"),
        "confirmation": raw.get("confirmation", "нет подтверждения"),
        "invalidation": raw.get("invalidation", "нет инвалидации"),
        "change_note": raw.get("change_note", ""),
        "reason_code": raw.get("reason_code", ""),
        "data_health": raw.get("data_health", "degraded"),
        "change_severity": raw.get("change_severity", "none"),
    }


def _extract_chart_data(state_main: dict[str, Any]) -> dict[str, Any]:
    if not fetch_all:
        return {"price_15m": [], "price_1h": [], "upper_line": [], "lower_line": []}

    try:
        data = fetch_all()
        k15m = data.get("k15m", [])
        k1h = data.get("k1h", [])

        close_15m = [float(row[4]) for row in k15m][-20:]
        close_1h = [float(row[4]) for row in k1h][-20:]

        upper = state_main.get("upper_level")
        lower = state_main.get("lower_level")

        upper_line = [float(upper)] * len(close_15m) if upper is not None else []
        lower_line = [float(lower)] * len(close_15m) if lower is not None else []

        return {
            "price_15m": close_15m,
            "price_1h": close_1h,
            "upper_line": upper_line,
            "lower_line": lower_line,
        }
    except Exception:
        return {"price_15m": [], "price_1h": [], "upper_line": [], "lower_line": []}


app = FastAPI(title="Macro Terminal API", version="0.1.0")

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
cors_env = os.getenv("CORS_ORIGINS", "")
allow_origins = [x.strip() for x in cors_env.split(",") if x.strip()] if cors_env else default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "ts": datetime.now().astimezone().isoformat(timespec="seconds"),
        "state_root": str(BASE_DIR),
    }


@app.get("/api/snapshot")
def snapshot() -> dict[str, Any]:
    state_main = _format_state(_read_json(STATE_MAIN))
    state_mirror = _format_state(_read_json(STATE_MIRROR))
    state_latest = _format_state(_read_json(STATE_LATEST))
    chart_data = _extract_chart_data(state_main)

    return {
        "meta": {
            "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
            "source": "local-state-files",
        },
        "market_pulse": {
            "symbol": state_main["symbol"],
            "updated_at": state_main["updated_at"],
            "scenario": state_main["scenario"],
            "change_severity": state_main["change_severity"],
            "data_health": state_main["data_health"],
        },
        "futures_structure": {
            "upper_level": state_main["upper_level"],
            "lower_level": state_main["lower_level"],
            "confirmation": state_main["confirmation"],
            "invalidation": state_main["invalidation"],
            "control_state": state_main["control_state"],
        },
        "scenario_engine": {
            "reason_code": state_main["reason_code"],
            "change_note": state_main["change_note"],
            "context_state": state_main["context_state"],
        },
        "charts": chart_data,
        "state_debug": {
            "main": state_main,
            "mirror": state_mirror,
            "latest": state_latest,
        },
    }
