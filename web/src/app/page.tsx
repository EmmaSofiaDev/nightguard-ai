"use client";

import React, { useState, useEffect, useTransition } from "react";
import SplineOrb from "./components/SplineOrb";
import {
  playHapticClick,
  playAlertTone,
  toggleAudioMute,
  getAudioMuted,
} from "./utils/audio";
import {
  Shield,
  Activity,
  Moon,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Wine,
  Dumbbell,
  Sparkles,
  Play,
  RotateCcw,
  Clock,
  HeartPulse,
  Volume2,
  VolumeX,
  Radio,
} from "lucide-react";

interface RiskDriver {
  factor: string;
  impact: string;
  severity: "high" | "medium" | "safe";
}

interface TimelinePoint {
  time: string;
  bg: number;
  isCrash: boolean;
}

interface PredictionResult {
  crash_probability: number;
  crash_percentage: number;
  predicted_nadir: number;
  risk_tier: "SAFE" | "ELEVATED" | "CRITICAL";
  countermeasures: string[];
  risk_drivers: RiskDriver[];
  timeline: TimelinePoint[];
  model_used: string;
}

const PRESETS = [
  {
    name: "Overbolus Crash",
    type: "danger",
    data: {
      bedtime_glucose: 112,
      active_insulin_units: 2.8,
      dinner_carbs_g: 55,
      bedtime_snack_carbs_g: 0,
      evening_exercise_min: 45,
      exercise_intensity: 2,
      alcohol_units: 1,
      sensor_trend_arrow: -1,
    },
  },
  {
    name: "Post-Run Drain",
    type: "elevated",
    data: {
      bedtime_glucose: 128,
      active_insulin_units: 1.4,
      dinner_carbs_g: 65,
      bedtime_snack_carbs_g: 10,
      evening_exercise_min: 60,
      exercise_intensity: 3,
      alcohol_units: 0,
      sensor_trend_arrow: -1,
    },
  },
  {
    name: "Late Dinner Spike",
    type: "elevated",
    data: {
      bedtime_glucose: 195,
      active_insulin_units: 3.4,
      dinner_carbs_g: 95,
      bedtime_snack_carbs_g: 0,
      evening_exercise_min: 0,
      exercise_intensity: 0,
      alcohol_units: 2,
      sensor_trend_arrow: 1,
    },
  },
  {
    name: "Optimal Plateau",
    type: "safe",
    data: {
      bedtime_glucose: 135,
      active_insulin_units: 0.6,
      dinner_carbs_g: 60,
      bedtime_snack_carbs_g: 15,
      evening_exercise_min: 0,
      exercise_intensity: 0,
      alcohol_units: 0,
      sensor_trend_arrow: 0,
    },
  },
];

export default function NightGuardPage() {
  const [activePreset, setActivePreset] = useState<string>("Overbolus Crash");

  // Vitals & inputs
  const [bg, setBg] = useState<number>(112);
  const [iob, setIob] = useState<number>(2.8);
  const [snackCarbs, setSnackCarbs] = useState<number>(0);
  const [workoutMin, setWorkoutMin] = useState<number>(45);
  const [workoutIntensity, setWorkoutIntensity] = useState<number>(2);
  const [alcoholUnits, setAlcoholUnits] = useState<number>(1);
  const [trendArrow, setTrendArrow] = useState<number>(-1);

  // Simulation playback state
  const [simStep, setSimStep] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Bayesian Prediction State
  const [prediction, setPrediction] = useState<PredictionResult>({
    crash_probability: 0.98,
    crash_percentage: 98.0,
    predicted_nadir: 48.9,
    risk_tier: "CRITICAL",
    countermeasures: [
      "Ingest 29g complex carbohydrates with fat (e.g. 1 slice toast + peanut butter).",
      "Reduce pump basal rate by -30% for 3.5 hours (Active IOB: 2.8U).",
      "Keep fast-acting glucose tablets bedside (Alcohol suppresses liver gluconeogenesis).",
      "Late glycogen repletion crash window predicted between 02:30 AM – 04:30 AM.",
    ],
    risk_drivers: [
      { factor: "Active Insulin (2.8U)", impact: "+45%", severity: "high" },
      { factor: "Evening Workout (45m)", impact: "+23%", severity: "medium" },
      { factor: "Alcohol (1 unit)", impact: "+15%", severity: "high" },
    ],
    timeline: [
      { time: "10 PM", bg: 112, isCrash: false },
      { time: "11 PM", bg: 99, isCrash: false },
      { time: "12 AM", bg: 87, isCrash: false },
      { time: "1 AM", bg: 74, isCrash: false },
      { time: "2 AM", bg: 62, isCrash: true },
      { time: "3 AM", bg: 49, isCrash: true },
      { time: "4 AM", bg: 74, isCrash: false },
      { time: "5 AM", bg: 98, isCrash: false },
      { time: "6 AM", bg: 123, isCrash: false },
    ],
    model_used: "Prior Labs TabPFN v2.0 (In-Context Bayesian Prior)",
  });

  const [isPending, startTransition] = useTransition();

  // Run Bayesian prediction whenever inputs change
  useEffect(() => {
    const runInference = async () => {
      try {
        const payload = {
          bedtime_glucose: bg,
          active_insulin_units: iob,
          dinner_carbs_g: 65,
          bedtime_snack_carbs_g: snackCarbs,
          evening_exercise_min: workoutMin,
          exercise_intensity: workoutIntensity,
          alcohol_units: alcoholUnits,
          sensor_trend_arrow: trendArrow,
        };

        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data: PredictionResult = await res.json();
          startTransition(() => {
            setPrediction(data);
          });
        }
      } catch (err) {
        console.error("Inference failed", err);
      }
    };

    const timer = setTimeout(runInference, 100);
    return () => clearTimeout(timer);
  }, [bg, iob, snackCarbs, workoutMin, workoutIntensity, alcoholUnits, trendArrow]);

  // Simulation scrubber effect
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimStep((prev) => {
        if (prev === null || prev >= 8) {
          setIsSimulating(false);
          playAlertTone("safe");
          return null;
        }
        playHapticClick(600 + prev * 80, 0.02);
        return prev + 1;
      });
    }, 550);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const startSimulation = () => {
    playHapticClick(900, 0.04);
    setSimStep(0);
    setIsSimulating(true);
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    playHapticClick(750, 0.03);
    setActivePreset(preset.name);
    setSimStep(null);
    setIsSimulating(false);
    setBg(preset.data.bedtime_glucose);
    setIob(preset.data.active_insulin_units);
    setSnackCarbs(preset.data.bedtime_snack_carbs_g);
    setWorkoutMin(preset.data.evening_exercise_min);
    setWorkoutIntensity(preset.data.exercise_intensity);
    setAlcoholUnits(preset.data.alcohol_units);
    setTrendArrow(preset.data.sensor_trend_arrow);
  };

  const handleAudioToggle = () => {
    const muted = toggleAudioMute();
    setIsMuted(muted);
    if (!muted) playHapticClick(1000, 0.04);
  };

  // Radial Gauge Calculations
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (prediction.crash_percentage / 100) * circumference;

  const zedMint = "#00e599";
  const riskStrokeColor =
    prediction.risk_tier === "CRITICAL"
      ? "#f43f5e"
      : prediction.risk_tier === "ELEVATED"
      ? "#f59e0b"
      : zedMint;

  const currentSimPoint =
    simStep !== null ? prediction.timeline[simStep] : null;

  return (
    <div
      className={`app-shell ${
        prediction.risk_tier === "CRITICAL"
          ? "theme-critical"
          : prediction.risk_tier === "ELEVATED"
          ? "theme-elevated"
          : "theme-safe"
      }`}
    >
      {/* Dynamic Ambient Aura Lighting */}
      <div
        className="dynamic-aura"
        style={{
          background:
            prediction.risk_tier === "CRITICAL"
              ? "radial-gradient(ellipse 75% 45% at 50% -10%, rgba(244, 63, 94, 0.16), transparent)"
              : prediction.risk_tier === "ELEVATED"
              ? "radial-gradient(ellipse 75% 45% at 50% -10%, rgba(245, 158, 11, 0.14), transparent)"
              : "radial-gradient(ellipse 75% 45% at 50% -10%, rgba(0, 229, 153, 0.15), transparent)",
        }}
      />

      {/* SSS-Tier EKG Live Telemetry Strip */}
      <div className="ekg-strip">
        <div className="ekg-live-wave">
          <Radio size={12} color="#00e599" />
          <span>VITAL SYNC: DEXCOM G7 (BT-LE)</span>
          <svg className="ekg-svg" viewBox="0 0 100 20">
            <path
              className="ekg-path"
              d="M0,10 L30,10 L35,2 L40,18 L45,6 L50,14 L55,10 L100,10"
            />
          </svg>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <span>HR: 66 BPM</span>
          <span>HRV: 58ms</span>
          <span>SpO2: 99%</span>
          <span style={{ color: "var(--accent-zed-bright)" }}>
            TABPFN IN-CONTEXT: 90D PRIOR ACTIVE
          </span>
        </div>
      </div>

      {/* HUD Navigation Header - Zed Green Luxury */}
      <header className="top-nav">
        <div className="brand-section">
          <div className="brand-icon">
            <Shield size={20} color="#050807" strokeWidth={2.6} />
          </div>
          <div className="brand-title">
            NightGuard
            <span className="brand-ai-pill">TabPFN v2.0</span>
          </div>
        </div>

        {/* Patient Telemetry Chip */}
        <div className="patient-telemetry-badge">
          <div className="telemetry-item">
            <span className="sensor-dot-live" />
            <strong>Liam V.</strong> (T1D • 24y)
          </div>
          <div className="telemetry-item">
            Sensor: <strong>Dexcom G7</strong>
          </div>
          <div className="telemetry-item">
            Bedtime: <strong>{currentSimPoint ? currentSimPoint.time : "22:00"}</strong>
          </div>
        </div>

        {/* Status Indicators & Audio Haptic Toggle */}
        <div className="top-actions">
          <button
            onClick={handleAudioToggle}
            className="audio-toggle-btn"
            title={isMuted ? "Unmute tactile audio" : "Mute tactile audio"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} color="#00e599" />}
          </button>

          <button
            onClick={startSimulation}
            disabled={isSimulating}
            className={`sim-playback-btn ${isSimulating ? "playing" : ""}`}
            title="Simulate Liam's sleep trajectory"
          >
            {isSimulating ? (
              <>
                <HeartPulse size={13} className="spin-icon" /> Simulating...
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" /> Replay Night
              </>
            )}
          </button>
        </div>
      </header>

      {/* Scenario Presets Bar */}
      <div className="scenario-strip">
        <span className="scenario-label">Quick Scenarios</span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p)}
            className={`scenario-pill ${p.type} ${
              activePreset === p.name ? "active" : ""
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Main 3-Column Glass Cockpit */}
      <main className="cockpit-grid">
        {/* Left Column: Tactile Bedtime Controls */}
        <section className="glass-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <Moon size={16} color="#00e599" />
              <h2 className="panel-title">Bedtime Telemetry</h2>
            </div>
            <span className="panel-chip">10:00 PM</span>
          </div>

          <div className="controls-stack">
            {/* Bedtime Glucose */}
            <div className="input-block">
              <div className="input-top-row">
                <label className="input-label">
                  <Activity size={14} color="#00e599" /> Bedtime Glucose
                </label>
                <span
                  className={`input-val-badge ${
                    bg < 100 ? "danger" : ""
                  }`}
                >
                  {bg} <small style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>mg/dL</small>
                </span>
              </div>
              <input
                type="range"
                min={70}
                max={260}
                value={bg}
                onChange={(e) => {
                  playHapticClick(400 + Number(e.target.value) * 2, 0.015);
                  setActivePreset("");
                  setBg(Number(e.target.value));
                }}
                className={`tactile-slider ${bg < 100 ? "danger" : ""}`}
              />
            </div>

            {/* Active Insulin on Board */}
            <div className="input-block">
              <div className="input-top-row">
                <label className="input-label">
                  <Zap size={14} color="#00e599" /> Active Insulin (IOB)
                </label>
                <span
                  className={`input-val-badge ${
                    iob >= 2.0 ? "danger" : ""
                  }`}
                >
                  {iob.toFixed(1)} <small style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Units</small>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5.0}
                step={0.1}
                value={iob}
                onChange={(e) => {
                  playHapticClick(500 + Number(e.target.value) * 100, 0.015);
                  setActivePreset("");
                  setIob(Number(e.target.value));
                }}
                className={`tactile-slider ${iob >= 2.0 ? "danger" : ""}`}
              />
            </div>

            {/* Bedtime Snack Carbs */}
            <div className="input-block">
              <div className="input-top-row">
                <label className="input-label">Bedtime Snack Carbs</label>
                <span className="input-val-badge">
                  {snackCarbs} <small style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>g</small>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={snackCarbs}
                onChange={(e) => {
                  playHapticClick(550 + Number(e.target.value) * 15, 0.015);
                  setActivePreset("");
                  setSnackCarbs(Number(e.target.value));
                }}
                className="tactile-slider"
              />
            </div>

            {/* Evening Workout */}
            <div className="input-block">
              <div className="input-top-row">
                <label className="input-label">
                  <Dumbbell size={14} color="#00e599" /> Post-6PM Workout
                </label>
                <span className="input-val-badge">
                  {workoutMin} <small style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>min</small>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={workoutMin}
                onChange={(e) => {
                  playHapticClick(500 + Number(e.target.value) * 5, 0.015);
                  setActivePreset("");
                  setWorkoutMin(Number(e.target.value));
                }}
                className="tactile-slider"
              />
            </div>

            {/* Evening Drinks */}
            <div className="input-block">
              <div className="input-top-row">
                <label className="input-label">
                  <Wine size={14} color="#00e599" /> Evening Drinks
                </label>
                <span
                  className={`input-val-badge ${
                    alcoholUnits > 0 ? "danger" : ""
                  }`}
                >
                  {alcoholUnits}{" "}
                  <small style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    {alcoholUnits === 1 ? "drink" : "drinks"}
                  </small>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                value={alcoholUnits}
                onChange={(e) => {
                  playHapticClick(600 + Number(e.target.value) * 80, 0.02);
                  setActivePreset("");
                  setAlcoholUnits(Number(e.target.value));
                }}
                className={`tactile-slider ${alcoholUnits > 0 ? "danger" : ""}`}
              />
            </div>

            {/* CGM Trend Arrow */}
            <div className="input-block">
              <label className="input-label">CGM Trend Arrow</label>
              <div className="trend-pill-group">
                {[
                  { label: "↑↑", val: 2 },
                  { label: "↗", val: 1 },
                  { label: "→", val: 0 },
                  { label: "↘", val: -1 },
                  { label: "↓↓", val: -2 },
                ].map((t) => (
                  <button
                    key={t.label}
                    onClick={() => {
                      playHapticClick(700, 0.02);
                      setActivePreset("");
                      setTrendArrow(t.val);
                    }}
                    className={`trend-btn ${trendArrow === t.val ? "active" : ""}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Risk Drivers Micro-Grid shifted to Left Column */}
          <div className="drivers-card-inline">
            <div className="panel-header" style={{ marginBottom: "6px" }}>
              <span className="panel-title" style={{ fontSize: "0.82rem" }}>
                Bayesian Prior Drivers
              </span>
              <span className="panel-chip">90-Day Context</span>
            </div>
            <div className="drivers-row">
              {prediction.risk_drivers.map((d, idx) => (
                <div key={idx} className={`driver-chip ${d.severity}`}>
                  <span>{d.factor}</span>
                  <strong>{d.impact}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Center Column: SSS-Tier Interactive 3D Bio-Sphere Vertically Centered */}
        <section className="center-stage">
          <SplineOrb
            riskTier={prediction.risk_tier}
            crashPercentage={prediction.crash_percentage}
            nadirMgDl={prediction.predicted_nadir}
          />
        </section>

        {/* Right Column: TabPFN In-Context Assessment */}
        <section className="glass-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <Sparkles size={16} color="#00e599" />
              <h2 className="panel-title">In-Context Forecast</h2>
            </div>
            <span className="panel-chip">TabPFN Foundation</span>
          </div>

          {/* Radial Risk Meter Box */}
          <div className="risk-meter-box">
            <div className="radial-gauge-container">
              <svg className="gauge-svg" viewBox="0 0 88 88">
                <circle
                  className="gauge-track"
                  cx="44"
                  cy="44"
                  r={radius}
                />
                <circle
                  className="gauge-progress"
                  cx="44"
                  cy="44"
                  r={radius}
                  stroke={riskStrokeColor}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="gauge-number">{prediction.crash_percentage}%</div>
            </div>

            <div className="risk-summary-text">
              <span
                className={`risk-badge ${prediction.risk_tier.toLowerCase()}`}
              >
                {prediction.risk_tier === "CRITICAL"
                  ? "CRITICAL CRASH RISK"
                  : prediction.risk_tier === "ELEVATED"
                  ? "ELEVATED HYPO DRIFT"
                  : "SAFE GLUCOSE PLATEAU"}
              </span>

              <div className="nadir-headline">
                Nadir: <strong>{prediction.predicted_nadir}</strong> mg/dL
              </div>

              <div className="crash-window-sub">
                {prediction.risk_tier === "CRITICAL"
                  ? "Predicted Crash Window: 02:15 – 04:30 AM"
                  : prediction.risk_tier === "ELEVATED"
                  ? "Predicted Nadir at ~03:30 AM"
                  : "Continuous Safe Margin > 80 mg/dL"}
              </div>
            </div>
          </div>

          {/* Dynamic Nocturnal Glucose Forecast Curve */}
          <div className="forecast-graph-container">
            <div className="graph-header">
              <span>
                Forecast Curve (10 PM – 6 AM)
                {currentSimPoint && (
                  <span style={{ color: "var(--accent-zed-bright)", marginLeft: "8px", fontWeight: "700" }}>
                    • {currentSimPoint.time}: {currentSimPoint.bg} mg/dL
                  </span>
                )}
              </span>
              <span style={{ color: "var(--danger-rose)" }}>Hypo Barrier: 70 mg/dL</span>
            </div>

            <div className="timeline-svg-wrap">
              <div className="timeline-danger-zone">
                <span className="danger-zone-label">HYPO ZONE &lt; 70</span>
              </div>

              {/* Render dynamic SVG polyline */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 320 80"
                preserveAspectRatio="none"
                style={{ overflow: "visible" }}
              >
                <defs>
                  <linearGradient id="zedCurveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e599" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00e599" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="zedCrashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {(() => {
                  const pts = prediction.timeline.map((pt, i) => {
                    const x = (i / (prediction.timeline.length - 1)) * 320;
                    const y = Math.max(5, Math.min(75, 80 - ((pt.bg - 40) / 180) * 80));
                    return { x, y, pt, i };
                  });

                  const pathD = pts.reduce(
                    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                    ""
                  );
                  const areaD = `${pathD} L 320 80 L 0 80 Z`;

                  return (
                    <>
                      <path
                        d={areaD}
                        fill={
                          prediction.risk_tier === "CRITICAL"
                            ? "url(#zedCrashGradient)"
                            : "url(#zedCurveGradient)"
                        }
                      />
                      <path
                        d={pathD}
                        fill="none"
                        stroke={riskStrokeColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        filter="drop-shadow(0 0 4px rgba(0, 229, 153, 0.4))"
                      />
                      {pts.map((p, idx) => {
                        const isCurrentScrub = simStep === idx;
                        return (
                          <g key={idx}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isCurrentScrub ? 7 : p.pt.bg < 70 ? 4 : 2.5}
                              fill={
                                isCurrentScrub
                                  ? "#ffffff"
                                  : p.pt.bg < 70
                                  ? "#f43f5e"
                                  : "#00e599"
                              }
                              stroke={isCurrentScrub ? riskStrokeColor : "#050807"}
                              strokeWidth={isCurrentScrub ? 3 : 1.5}
                            />
                            {isCurrentScrub && (
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={12}
                                fill="none"
                                stroke={riskStrokeColor}
                                strokeWidth={1.5}
                                opacity={0.7}
                              />
                            )}
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Clinical Countermeasures */}
          <div className="countermeasures-list">
            <span
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-faint)",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
              }}
            >
              Actionable Prescriptions
            </span>

            {prediction.countermeasures.map((cm, idx) => (
              <div key={idx} className="action-pill-row">
                <div
                  className={`action-icon-pill ${
                    prediction.risk_tier === "CRITICAL" ? "critical" : "safe"
                  }`}
                >
                  {prediction.risk_tier === "CRITICAL" ? (
                    <AlertTriangle size={12} />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                </div>
                <span>{cm}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer Minimal Telemetry */}
      <footer className="footer-strip">
        <div className="footer-left">
          <span>PATIENT: LIAM V. (90D CGM CONTEXT LOADED)</span>
          <span className="footer-dot" />
          <span>PRIOR LABS TABPFN IN-CONTEXT ENGINE</span>
          <span className="footer-dot" />
          <span>ZERO CLOUD EXPOSURE</span>
        </div>
        <div>NIGHTGUARD AI • ZED GREEN EDITION</div>
      </footer>
    </div>
  );
}
