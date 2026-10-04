import numpy as np
import pandas as pd
from pathlib import Path

def generate_cgm_dataset(n_days=90, seed=42):
    """
    Generates realistic, physiologically grounded Continuous Glucose Monitor (CGM)
    and metabolic event logs for Liam (Type-1 Diabetic).
    Correlations reflect actual endocrinological dynamics:
    - Alcohol blocks hepatic gluconeogenesis -> increases crash risk.
    - Post-6pm intense exercise causes delayed nocturnal insulin sensitivity.
    - High active insulin (IOB) at bedtime without snack causes severe crashes.
    """
    np.random.seed(seed)
    
    dates = pd.date_range(end=pd.Timestamp.now(), periods=n_days, freq="D").strftime("%Y-%m-%d")
    
    # Baseline bedtime glucose (mg/dL): typically 90 to 220
    bedtime_glucose = np.random.normal(135, 28, n_days).clip(85, 240)
    
    # Active Insulin on Board (IOB) at 10 PM (Units): 0.0 to 4.5
    active_insulin = np.random.exponential(1.2, n_days).clip(0.0, 4.5)
    
    # Dinner carbs (grams): 30 to 110
    dinner_carbs = np.random.normal(65, 18, n_days).clip(25, 120)
    
    # Bedtime snack carbs (grams): 0 to 35
    bedtime_snack_carbs = np.random.choice([0, 10, 15, 20, 30], size=n_days, p=[0.45, 0.20, 0.15, 0.12, 0.08])
    
    # Evening exercise duration (minutes): 0 to 60
    evening_exercise_min = np.random.choice([0, 20, 35, 45, 60], size=n_days, p=[0.40, 0.20, 0.20, 0.12, 0.08])
    
    # Exercise intensity: 0 (None), 1 (Walk/Light), 2 (Moderate Run/Gym), 3 (HIIT)
    exercise_intensity = np.where(evening_exercise_min == 0, 0, np.random.choice([1, 2, 3], size=n_days, p=[0.3, 0.5, 0.2]))
    
    # Sleep hours from prior night: 4.5 to 8.5
    prior_sleep_hours = np.random.normal(6.8, 1.1, n_days).clip(4.5, 9.0)
    
    # Alcohol consumed (units): 0 to 3
    alcohol_units = np.random.choice([0, 1, 2, 3], size=n_days, p=[0.70, 0.18, 0.08, 0.04])
    
    # CGM Trend Arrow at 10 PM: -2 (Double Down), -1 (Single Down), 0 (Flat), 1 (Single Up), 2 (Double Up)
    trend_arrow = np.random.choice([-2, -1, 0, 1, 2], size=n_days, p=[0.08, 0.22, 0.45, 0.18, 0.07])
    
    # Calculate physiological crash risk score (latent variable)
    # Risk factors:
    # + High active insulin
    # + Low bedtime glucose
    # + Evening exercise (delayed muscular glucose uptake)
    # + Alcohol (liver cannot release glycogen)
    # + Downward trend arrow
    # - Bedtime snack carbs (mitigates risk)
    
    risk_score = (
        (active_insulin * 1.8)
        - ((bedtime_glucose - 100) * 0.03)
        + (evening_exercise_min * 0.04 * (exercise_intensity * 0.5))
        + (alcohol_units * 1.4)
        - (trend_arrow * 0.8)
        - (bedtime_snack_carbs * 0.12)
        - ((prior_sleep_hours - 7.0) * 0.15)
        - 1.1 # Intercept calibration
    )
    
    # Sigmoid to probability
    crash_prob = 1.0 / (1.0 + np.exp(-risk_score))
    
    # Actual nocturnal crash event (glucose < 70 mg/dL between midnight and 6 AM)
    nocturnal_crash = (np.random.rand(n_days) < crash_prob).astype(int)
    
    # Minimum nadir glucose during sleep (mg/dL)
    nadir_glucose = np.where(
        nocturnal_crash == 1,
        np.random.normal(54, 7, n_days).clip(42, 68),
        np.random.normal(108, 18, n_days).clip(72, 175)
    )
    
    df = pd.DataFrame({
        "date": dates,
        "bedtime_glucose": np.round(bedtime_glucose, 1),
        "active_insulin_units": np.round(active_insulin, 2),
        "dinner_carbs_g": np.round(dinner_carbs, 1),
        "bedtime_snack_carbs_g": np.round(bedtime_snack_carbs, 1),
        "evening_exercise_min": evening_exercise_min,
        "exercise_intensity": exercise_intensity,
        "prior_sleep_hours": np.round(prior_sleep_hours, 1),
        "alcohol_units": alcohol_units,
        "sensor_trend_arrow": trend_arrow,
        "nadir_glucose": np.round(nadir_glucose, 1),
        "nocturnal_crash": nocturnal_crash
    })
    
    return df

def ensure_data_file():
    target_dir = Path(__file__).resolve().parent.parent / "data"
    target_dir.mkdir(parents=True, exist_ok=True)
    target_csv = target_dir / "liams_90day_cgm_history.csv"
    if not target_csv.exists():
        df = generate_cgm_dataset(n_days=90, seed=42)
        df.to_csv(target_csv, index=False)
        print(f"[Data] Created sample CGM dataset with {len(df)} days at: {target_csv}")
    return target_csv

if __name__ == "__main__":
    path = ensure_data_file()
    df = pd.read_csv(path)
    print("Dataset Summary:")
    print(f"Total days logged   : {len(df)}")
    print(f"Nocturnal crashes   : {df['nocturnal_crash'].sum()} ({df['nocturnal_crash'].mean()*100:.1f}%)")
    print(f"Average bedtime BG  : {df['bedtime_glucose'].mean():.1f} mg/dL")
    print(f"Average active IOB  : {df['active_insulin_units'].mean():.2f} U")
