import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

# Local engine import
from .engine import NightGuardEngine

app = FastAPI(
    title="NightGuard AI — API",
    description="Zero-Leak In-Context Tabular AI Guardian for Diabetic CGM Logs (TabPFN)",
    version="1.0.0"
)

# Initialize engine
engine = NightGuardEngine()

# Pydantic input schema
class BedtimeMetricsInput(BaseModel):
    bedtime_glucose: float = Field(..., description="Bedtime CGM Glucose (mg/dL)")
    active_insulin_units: float = Field(..., description="Active Insulin on Board (IOB) in Units")
    dinner_carbs_g: float = Field(default=65.0, description="Carbohydrates in dinner (grams)")
    bedtime_snack_carbs_g: float = Field(default=0.0, description="Bedtime snack carbs (grams)")
    evening_exercise_min: float = Field(default=0.0, description="Minutes of workout after 6 PM")
    exercise_intensity: int = Field(default=0, description="0=None, 1=Light, 2=Moderate, 3=HIIT")
    prior_sleep_hours: float = Field(default=6.8, description="Sleep duration from previous night")
    alcohol_units: int = Field(default=0, description="Alcohol drinks consumed tonight")
    sensor_trend_arrow: int = Field(default=0, description="-2=Double Down, -1=Down, 0=Flat, 1=Up, 2=Double Up")

@app.get("/api/health")
def healthcheck():
    """Healthcheck endpoint for Render cloud uptime probes."""
    return {
        "status": "healthy",
        "service": "NightGuard AI",
        "tabpfn_ready": engine.is_tabpfn_ready,
        "patient": "Liam Vance (T1D)",
        "days_logged": len(engine.df)
    }

@app.get("/api/history")
def get_history():
    """Returns Liam's 90-day CGM historical records."""
    records = engine.df.tail(60).to_dict(orient="records")
    return {
        "total_days": len(engine.df),
        "total_crashes": int(engine.df["nocturnal_crash"].sum()),
        "crash_rate_pct": round(float(engine.df["nocturnal_crash"].mean() * 100), 1),
        "records": records
    }

@app.post("/api/predict")
def predict_nocturnal_crash(metrics: BedtimeMetricsInput):
    """Computes TabPFN Bayesian crash probability for tonight's bedtime values."""
    try:
        result = engine.predict(metrics.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/benchmark")
def get_benchmark():
    """Returns comparative validation metrics between TabPFN and standard ML models."""
    return engine.benchmark_comparison()

# Mount frontend directory for static UI serving
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(frontend_dir / "index.html")

    @app.get("/{file_name}")
    def serve_frontend_files(file_name: str):
        file_path = frontend_dir / file_name
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dir / "index.html")
