import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const TABS = ["OVERVIEW", "RATES", "INFLATION", "GROWTH", "LABOR", "RISK"];

function Panel({ title, children }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value, tone = "neutral" }) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value ?? "-"}</div>
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div className="item">
      <span className="label">{label}</span>
      <span className="value mono">{value ?? "-"}</span>
    </div>
  );
}

function ChartBox({ title, subtitle }) {
  return (
    <div className="chart-box">
      <div className="chart-head">
        <span>{title}</span>
        <small>{subtitle}</small>
      </div>
      <div className="chart-placeholder">
        <div className="line line-a" />
        <div className="line line-b" />
      </div>
    </div>
  );
}

function toPoints(series, width, height, min, max) {
  if (!series?.length) return "";
  const range = max - min || 1;
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1 || 1)) * (width - 8) + 4;
      const y = height - ((v - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
}

function LiveChart({ primary = [], secondary = [], upper = [], lower = [] }) {
  const width = 560;
  const height = 150;
  const all = [...primary, ...secondary, ...upper, ...lower].filter((v) => Number.isFinite(v));
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 1;

  const p1 = toPoints(primary, width, height, min, max);
  const p2 = toPoints(secondary, width, height, min, max);
  const pu = toPoints(upper, width, height, min, max);
  const pl = toPoints(lower, width, height, min, max);

  return (
    <svg className="live-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={pu} fill="none" stroke="#d1b64d" strokeWidth="1.5" />
      <polyline points={pl} fill="none" stroke="#57f89f" strokeWidth="1.5" />
      <polyline points={p2} fill="none" stroke="#4db8ff" strokeWidth="1.4" opacity="0.8" />
      <polyline points={p1} fill="none" stroke="#57f89f" strokeWidth="2" />
    </svg>
  );
}

function Badge({ text, tone = "neutral" }) {
  return <span className={`badge badge-${tone}`}>{text}</span>;
}

export default function App() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("OVERVIEW");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/snapshot`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (mounted) {
          setSnapshot(data);
          setError("");
        }
      } catch (e) {
        if (mounted) setError(String(e));
      }
    };

    load();
    const id = setInterval(load, 7000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const pulse = snapshot?.market_pulse ?? {};
  const futures = snapshot?.futures_structure ?? {};
  const scenario = snapshot?.scenario_engine ?? {};
  const charts = snapshot?.charts ?? {};
  const generatedAt = useMemo(() => snapshot?.meta?.generated_at ?? "-", [snapshot]);
  const tone =
    pulse.scenario === "long" ? "bullish" : pulse.scenario === "short" ? "bearish" : "neutral";
  const regimeTitle =
    pulse.scenario === "long"
      ? "MARKET REGIME: BUYER CONTROL"
      : pulse.scenario === "short"
      ? "MARKET REGIME: SELLER CONTROL"
      : "MARKET REGIME: BALANCE / WAIT";
  const severityTone =
    pulse.change_severity === "major"
      ? "bearish"
      : pulse.change_severity === "minor"
      ? "warning"
      : "neutral";

  const tabSubtitle = {
    OVERVIEW: "Macro + futures pulse",
    RATES: "Rates structure",
    INFLATION: "Inflation pressure map",
    GROWTH: "Growth & activity",
    LABOR: "Labor market stress",
    RISK: "Sentiment and risk matrix",
  }[activeTab];

  const tabAlert = {
    OVERVIEW: "Cross-asset pulse focused on scenario continuity.",
    RATES: "Rates pressure can flip risk regime quickly.",
    INFLATION: "Watch for energy and services re-acceleration.",
    GROWTH: "Weak growth + sticky inflation increases stagflation risk.",
    LABOR: "Labor deterioration can reprice policy path.",
    RISK: "Sentiment extremes can cause sharp squeezes.",
  }[activeTab];

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="dot dot-r" />
          <span className="dot dot-y" />
          <span className="dot dot-g" />
          <h1>MACRO TERMINAL</h1>
          <small>v0.2.0</small>
        </div>
        <div className="meta mono">
          <span>{generatedAt}</span>
          <span>{pulse.symbol ?? "SOLUSDT"}</span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={tab === activeTab ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className={`regime regime-${tone}`}>
        <h2>{regimeTitle}</h2>
        <p>{tabAlert}</p>
        <div className="regime-subline">
          <span>{scenario.context_state ?? "No context."}</span>
          <span>{futures.control_state ?? "No control state."}</span>
        </div>
        {error ? <p className="error">API error: {error}</p> : null}
      </section>

      <section className="snapshot-strip">
        <Metric label="SCENARIO" value={pulse.scenario} tone={tone} />
        <Metric label="UPPER LEVEL" value={futures.upper_level} />
        <Metric label="LOWER LEVEL" value={futures.lower_level} />
        <Metric label="REASON" value={scenario.reason_code} />
        <Metric label="SEVERITY" value={pulse.change_severity} />
        <Metric
          label="DATA HEALTH"
          value={pulse.data_health}
          tone={pulse.data_health === "ok" ? "bullish" : "bearish"}
        />
      </section>

      <section className="section-head">
        <div className="section-title">
          <h3>{activeTab}</h3>
          <small>{tabSubtitle}</small>
        </div>
        <div className="section-badges">
          <Badge text={pulse.scenario ?? "no trade"} tone={tone} />
          <Badge text={pulse.change_severity ?? "none"} tone={severityTone} />
          <Badge text={pulse.data_health ?? "degraded"} tone={pulse.data_health === "ok" ? "bullish" : "bearish"} />
        </div>
      </section>

      <div className="chart-grid">
        <div className="chart-box">
          <div className="chart-head">
            <span>PRICE STRUCTURE</span>
            <small>SOL 15m + 1h</small>
          </div>
          <div className="chart-placeholder">
            <LiveChart
              primary={charts.price_15m}
              secondary={charts.price_1h}
              upper={charts.upper_line}
              lower={charts.lower_line}
            />
          </div>
        </div>
        <div className="chart-box">
          <div className="chart-head">
            <span>CONTROL VS INVALIDATION</span>
            <small>scenario guardrails</small>
          </div>
          <div className="chart-placeholder">
            <LiveChart
              primary={charts.price_15m}
              upper={charts.upper_line}
              lower={charts.lower_line}
            />
          </div>
        </div>
      </div>

      <div className="grid">
        <Panel title="Futures Structure">
          <Item label="Confirmation" value={futures.confirmation} />
          <Item label="Invalidation" value={futures.invalidation} />
          <Item label="Control" value={futures.control_state} />
          <Item label="Change Note" value={scenario.change_note} />
        </Panel>

        <Panel title="Scenario Engine">
          <Item label="Reason Code" value={scenario.reason_code} />
          <Item label="Context State" value={scenario.context_state} />
          <Item label="Updated At" value={pulse.updated_at} />
          <Item label="Active Tab" value={activeTab} />
        </Panel>

        <Panel title="Risk / Opportunity">
          <Item
            label="Risk Bias"
            value={tone === "bearish" ? "elevated" : tone === "bullish" ? "moderate" : "balanced"}
          />
          <Item
            label="Key Opportunity"
            value={
              tone === "bullish"
                ? `hold above ${futures.upper_level}`
                : tone === "bearish"
                ? `accept below ${futures.lower_level}`
                : "wait breakout"
            }
          />
          <Item label="Next Check" value="hourly state refresh" />
          <Item label="Source" value="local-state-files" />
        </Panel>
      </div>

      <footer className="terminal-footer">
        <span>Created for Young Tyler Terminal Workflow</span>
        <span>keys: [1-6] tabs (planned)</span>
      </footer>
    </main>
  );
}
